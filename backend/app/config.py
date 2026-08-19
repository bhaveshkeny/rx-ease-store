import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("POSTGRES_URL_NON_POOLING")
    or os.getenv("POSTGRES_URL")
    or "postgresql+psycopg://postgres:postgres@localhost:5432/pharmacy"
)
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:8080"
)
