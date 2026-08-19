"""Pytest fixtures using an isolated in-memory SQLite database."""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ.setdefault("SECRET_KEY", "test-secret")

from app import database  # noqa: E402

test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Redirect the app's engine/session factory to the test database before importing
# app.main/app.seed so the startup hook uses the isolated test database.
database.engine = test_engine
database.SessionLocal = TestingSessionLocal

from app import seed as seed_module  # noqa: E402

seed_module.SessionLocal = TestingSessionLocal

from app.main import app  # noqa: E402
from app.models import Medicine, User  # noqa: E402
from app.auth import hash_password  # noqa: E402


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[database.get_db] = _override_get_db


@pytest.fixture()
def db():
    database.Base.metadata.drop_all(bind=test_engine)
    database.Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db, tmp_path, monkeypatch):
    """TestClient with a fresh schema and an isolated prescription upload dir."""
    from app.routers import orders as orders_router

    monkeypatch.setattr(orders_router, "UPLOAD_DIR", tmp_path / "prescriptions")
    with TestClient(app) as c:  # runs startup: create_all + seed_medicines
        yield c


@pytest.fixture()
def otc_medicine(db) -> Medicine:
    med = Medicine(
        name="Test Paracetamol",
        brand="TestBrand",
        category="Pain Relief",
        price=10.0,
        pack_size="20 tablets",
        requires_prescription=False,
        stock=50,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@pytest.fixture()
def rx_medicine(db) -> Medicine:
    med = Medicine(
        name="Test Amoxicillin",
        brand="TestBrand",
        category="Antibiotics",
        price=25.0,
        pack_size="21 capsules",
        requires_prescription=True,
        stock=5,
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


def register(client: TestClient, email="patient@example.com", password="Passw0rd!") -> str:
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "full_name": "Test Patient", "phone": "0700000000"},
    )
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


@pytest.fixture()
def auth_headers(client) -> dict:
    return {"Authorization": f"Bearer {register(client)}"}


@pytest.fixture()
def pharmacist_headers(client, db) -> dict:
    user = User(
        email="pharmacist@example.com",
        hashed_password=hash_password("Passw0rd!"),
        full_name="Pharmacist",
        is_pharmacist=True,
    )
    db.add(user)
    db.commit()
    res = client.post(
        "/api/auth/login",
        data={"username": "pharmacist@example.com", "password": "Passw0rd!"},
    )
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}
