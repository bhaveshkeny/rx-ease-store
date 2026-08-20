import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .config import AUTO_INIT_DB, CORS_ORIGINS
from .routers import auth_routes, medicines, orders
from .seed import seed_medicines,seed_users

app = FastAPI(
    title="MediCare Pharmacy API",
    description="FastAPI + Snowflake backend for the MediCare pharmacy storefront.",
    version="1.0.0",
)

origins = CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(medicines.router)
app.include_router(orders.router)


@app.on_event("startup")
def on_startup() -> None:
    if AUTO_INIT_DB:
        Base.metadata.create_all(bind=engine)
        seed_medicines()
        seed_users()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
