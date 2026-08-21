import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
AUTO_INIT_DB = os.getenv("AUTO_INIT_DB", "false").lower() == "true"
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
API_KEY = os.getenv("API_KEY")
BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN")
AUTO_INIT_DB = os.getenv("AUTO_INIT_DB", "true").strip().lower() in {"1", "true", "yes", "on"}
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:8080,https://rx-ease-store-app-2.vercel.app/"
)
