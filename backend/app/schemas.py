from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class MedicineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    brand: str | None
    category: str
    description: str | None
    price: float
    pack_size: str | None
    requires_prescription: bool
    stock: int
    image_url: str | None


class MedicineCreate(BaseModel):
    name: str
    brand: str | None = None
    category: str
    description: str | None = None
    price: float = 0
    pack_size: str | None = None
    requires_prescription: bool = False
    stock: int = 0
    image_url: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    phone: str | None = None
    is_pharmacist: bool = False

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str | None
    phone: str | None
    is_pharmacist: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"



class OrderItemIn(BaseModel):
    medicine_id: str
    quantity: int = 1


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    medicine_id: str | None
    name: str
    quantity: int
    unit_price: float


class OrderCreate(BaseModel):
    full_name: str
    phone: str
    address: str
    items: list[OrderItemIn]


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    phone: str
    address: str
    total: float
    status: str
    prescription_path: str | None
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    status: str
