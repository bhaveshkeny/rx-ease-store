import re
import time
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_pharmacist
from ..database import get_db
from ..models import Medicine, Order, OrderItem, User
from ..schemas import OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_STATUSES = {"placed", "awaiting_verification", "dispensed", "delivered", "cancelled"}


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

    # Vercel function filesystems are ephemeral, so do not write uploads to disk.
    # Store the small prescription file directly in Neon for this project.
    order.prescription_path = relative
    order.prescription_filename = safe_name
    order.prescription_content_type = file.content_type
    order.prescription_data = content
    db.commit()
    db.refresh(order)
    return order


@router.get("/{order_id}/prescription")
def download_prescription(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    if not order or not order.prescription_path:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if order.user_id != user.id and not user.is_pharmacist:
        raise HTTPException(status_code=403, detail="Not allowed")

    if not order.prescription_data:
        raise HTTPException(status_code=404, detail="Prescription file missing")

    from fastapi.responses import Response

    return Response(
        content=order.prescription_data,
        media_type=order.prescription_content_type or "application/octet-stream",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{order.prescription_filename or "prescription"}"'
            )
        },
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
