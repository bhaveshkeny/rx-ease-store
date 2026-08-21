import re
import time
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_pharmacist
from ..config import BLOB_READ_WRITE_TOKEN
from ..database import get_db
from ..models import Medicine, Order, OrderItem, User
from ..schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])

BLOB_BASE_URL = "https://blob.vercel-storage.com"
ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_STATUSES = {"placed", "awaiting_verification", "dispensed", "delivered", "cancelled"}


def blob_url(pathname: str) -> str:
    return f"{BLOB_BASE_URL}/{quote(pathname, safe='/')}"


async def upload_blob(pathname: str, content: bytes, content_type: str) -> dict:
    if not BLOB_READ_WRITE_TOKEN:
        raise HTTPException(status_code=503, detail="Blob storage is not configured")
    headers = {
        "Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}",
        "x-api-version": "7",
        "x-content-type": content_type,
        "x-add-random-suffix": "0",
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.put(blob_url(pathname), content=content, headers=headers)
    if response.is_error:
        raise HTTPException(status_code=502, detail="Could not upload prescription")
    return response.json()


async def download_blob(url: str) -> httpx.Response:
    if not BLOB_READ_WRITE_TOKEN:
        raise HTTPException(status_code=503, detail="Blob storage is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            url,
            headers={"Authorization": f"Bearer {BLOB_READ_WRITE_TOKEN}"},
        )
    if response.status_code == 404:
        raise HTTPException(status_code=404, detail="Prescription file missing")
    if response.is_error:
        raise HTTPException(status_code=502, detail="Could not download prescription")
    return response


@router.post("", response_model=OrderOut, status_code=201)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order = Order(
        user_id=user.id,
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
    )
    total = 0.0
    needs_rx = False

    for line in payload.items:
        medicine = db.get(Medicine, line.medicine_id)
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine {line.medicine_id} not found")
        if line.quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        if medicine.stock < line.quantity:
            raise HTTPException(status_code=409, detail=f"{medicine.name} is out of stock")

        medicine.stock -= line.quantity
        needs_rx = needs_rx or medicine.requires_prescription
        total += medicine.price * line.quantity
        order.items.append(
            OrderItem(
                medicine_id=medicine.id,
                name=medicine.name,
                quantity=line.quantity,
                unit_price=medicine.price,
            )
        )

    delivery = 3.99 if 0 < total < 30 else 0.0
    order.total = round(total + delivery, 2)
    order.status = "awaiting_verification" if needs_rx else "placed"

    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    return list(db.scalars(stmt))


@router.post("/{order_id}/prescription", response_model=OrderOut)
async def upload_prescription(
    order_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPG, PNG or PDF files are accepted")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File larger than 10 MB")

    safe_name = re.sub(r"[^\w.\-]", "_", file.filename or "prescription")
    relative = f"{user.id}/{int(time.time())}-{safe_name}"
    blob = await upload_blob(f"prescriptions/{relative}", content, file.content_type)

    order.prescription_path = blob["url"]
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/prescription")
async def download_prescription(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    if not order or not order.prescription_path:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if order.user_id != user.id and not user.is_pharmacist:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not order.prescription_path.startswith("https://"):
        raise HTTPException(status_code=404, detail="Prescription file missing")
    response = await download_blob(order.prescription_path)
    return Response(
        content=response.content,
        media_type=response.headers.get("content-type", "application/octet-stream"),
        headers={"Content-Disposition": response.headers.get("content-disposition", "attachment")},
    )


@router.get("/pharmacy/queue", response_model=list[OrderOut])
def verification_queue(db: Session = Depends(get_db), _=Depends(require_pharmacist)):
    stmt = (
        select(Order)
        .where(Order.status == "awaiting_verification")
        .order_by(Order.created_at.asc())
    )
    return list(db.scalars(stmt))


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_pharmacist),
):
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Unknown status")
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
