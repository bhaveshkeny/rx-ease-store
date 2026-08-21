from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..auth import require_pharmacist
from ..database import get_db
from ..models import Medicine
from ..schemas import MedicineCreate, MedicineOut, PaginatedMedicineResponse

router = APIRouter(prefix="/api/medicines", tags=["medicines"])


@router.get("", response_model=PaginatedMedicineResponse)
def list_medicines(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    rx_only: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=6, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Medicine)

    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(
                Medicine.name.ilike(like),
                Medicine.brand.ilike(like),
                Medicine.category.ilike(like),
            )
        )

    if category:
        stmt = stmt.where(Medicine.category == category)

    if rx_only is not None:
        stmt = stmt.where(Medicine.requires_prescription.is_(rx_only))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    stmt = (
        stmt.order_by(Medicine.requires_prescription, Medicine.name)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    medicines = list(db.scalars(stmt))
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": medicines,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    return sorted({c for c in db.scalars(select(Medicine.category))})


@router.get("/{medicine_id}", response_model=MedicineOut)
def get_medicine(medicine_id: str, db: Session = Depends(get_db)):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.post("", response_model=MedicineOut, status_code=201)
def create_medicine(
    payload: MedicineCreate,
    db: Session = Depends(get_db),
    _=Depends(require_pharmacist),
):
    medicine = Medicine(**payload.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine
