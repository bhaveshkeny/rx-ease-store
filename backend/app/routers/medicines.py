from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..auth import require_pharmacist
from ..database import get_db
from ..models import Medicine
from ..schemas import MedicineCreate, MedicineOut

router = APIRouter(prefix="/api/medicines", tags=["medicines"])



@router.get("", response_model=list[MedicineOut])
def list_medicines(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    rx_only: bool | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Medicine)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(
            or_(Medicine.name.ilike(like), Medicine.brand.ilike(like), Medicine.category.ilike(like))
        )
    if category:
        stmt = stmt.where(Medicine.category == category)
    if rx_only is not None:
        stmt = stmt.where(Medicine.requires_prescription.is_(rx_only))
    stmt = stmt.order_by(Medicine.requires_prescription, Medicine.name)
    return list(db.scalars(stmt))


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
