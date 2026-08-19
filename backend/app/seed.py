from datetime import datetime
import uuid

from sqlalchemy import select

from .database import SessionLocal
from .models import Medicine, User

MEDICINES = [
    # OTC
    ("Paracetamol 500mg", "Calpol", "Pain Relief", "Relieves mild to moderate pain and reduces fever.", 2.49, "20 tablets", False, 240),
    ("Ibuprofen 200mg", "Brufen", "Pain Relief", "Anti-inflammatory for headaches, muscle pain and fever.", 3.99, "24 tablets", False, 180),
    ("Cetirizine 10mg", "Zyrtec", "Allergy", "Non-drowsy antihistamine for hay fever and allergies.", 4.25, "30 tablets", False, 150),
    ("Loratadine 10mg", "Claritin", "Allergy", "Once-daily relief from allergy symptoms.", 4.75, "30 tablets", False, 120),
    ("Cough Syrup", "Benylin", "Cold & Flu", "Soothes dry, tickly coughs.", 6.80, "150 ml", False, 95),
    ("Saline Nasal Spray", "Sterimar", "Cold & Flu", "Gently clears blocked noses. Suitable for all ages.", 8.10, "50 ml", False, 70),
    ("Antacid Suspension", "Gaviscon", "Digestive Health", "Fast relief from heartburn and indigestion.", 7.40, "300 ml", False, 110),
    ("Oral Rehydration Salts", "Dioralyte", "Digestive Health", "Restores fluids and electrolytes after dehydration.", 5.99, "12 sachets", False, 90),
    ("Vitamin C 1000mg", "Redoxon", "Vitamins", "Effervescent tablets to support immunity.", 5.20, "20 tablets", False, 160),
    ("Vitamin D3 1000 IU", "HealthAid", "Vitamins", "Supports bone health and immune function.", 6.50, "60 capsules", False, 200),
    ("Digital Thermometer", "Omron", "Devices", "Fast, accurate underarm and oral readings.", 12.99, "1 unit", False, 45),
    ("Blood Pressure Monitor", "Omron", "Devices", "Upper-arm automatic monitor with memory.", 39.90, "1 unit", False, 25),
    # Prescription only
    ("Amoxicillin 500mg", "Amoxil", "Antibiotics", "Broad-spectrum antibiotic for bacterial infections.", 9.60, "21 capsules", True, 80),
    ("Azithromycin 250mg", "Zithromax", "Antibiotics", "Short-course antibiotic for respiratory infections.", 14.20, "6 tablets", True, 60),
    ("Metformin 500mg", "Glucophage", "Diabetes", "First-line therapy for type 2 diabetes.", 8.35, "60 tablets", True, 100),
    ("Insulin Glargine", "Lantus", "Diabetes", "Long-acting basal insulin pen. Cold-chain shipped.", 45.00, "3 ml pen", True, 30),
    ("Amlodipine 5mg", "Norvasc", "Cardiac Care", "Lowers blood pressure and prevents angina.", 7.90, "30 tablets", True, 85),
    ("Salbutamol Inhaler", "Ventolin", "Respiratory", "Reliever inhaler for asthma and wheezing.", 11.50, "200 doses", True, 65),
]


def seed_medicines() -> None:
    """Insert the starter catalogue once, on first boot."""
    db = SessionLocal()
    try:
        if db.scalar(select(Medicine).limit(1)):
            return
        db.add_all(
            Medicine(
                name=name,
                brand=brand,
                category=category,
                description=description,
                price=price,
                pack_size=pack_size,
                requires_prescription=rx,
                stock=stock,
            )
            for name, brand, category, description, price, pack_size, rx, stock in MEDICINES
        )
        db.commit()
    finally:
        db.close()


# Helper for generating UUIDs
def new_id():
    return str(uuid.uuid4())


test_users = [
    {
        "id": new_id(),
        "email": "alice@example.com",
        "hashed_password": "$2b$12$abc123hashedpasswordexample",  # fake bcrypt hash
        "full_name": "Alice Johnson",
        "phone": "9876543210",
        "is_pharmacist": True,
        "created_at": datetime.utcnow(),
    },
    {
        "id": new_id(),
        "email": "bob@example.com",
        "hashed_password": "$2b$12$xyz456hashedpasswordexample",
        "full_name": "Bob Kumar",
        "phone": "9123456789",
        "is_pharmacist": False,
        "created_at": datetime.utcnow(),
    },
    {
        "id": new_id(),
        "email": "charlie@example.com",
        "hashed_password": "$2b$12$def789hashedpasswordexample",
        "full_name": "Charlie Singh",
        "phone": None,
        "is_pharmacist": False,
        "created_at": datetime.utcnow(),
    }
]

def seed_users() -> None:
    """Insert the starter catalogue once, on first boot."""
    db = SessionLocal()
    try:
        if db.scalar(select(User).limit(1)):
            return
        db.add_all(
            User(
                id=user_data["id"],
                email=user_data["email"],
                hashed_password=user_data["hashed_password"],
                full_name=user_data["full_name"],
                phone=user_data["phone"],
                is_pharmacist=user_data["is_pharmacist"],
                created_at=user_data["created_at"],
            )
            for user_data in test_users
        )
        db.commit()
    finally:
        db.close()
