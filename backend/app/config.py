import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8080",
)

# Set to true only when you intentionally want the API to create/seed tables
# automatically on a cold start. For this practice project it is enabled by default.
AUTO_INIT_DB = os.getenv("AUTO_INIT_DB", "true").lower() == "true"
