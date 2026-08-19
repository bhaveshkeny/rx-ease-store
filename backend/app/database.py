import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

# --- Snowflake connection -----------------------------------------------------
# Set these as environment variables (or in a .env you load yourself):
#
#   SNOWFLAKE_ACCOUNT    e.g. ab12345.eu-west-1   (account identifier)
#   SNOWFLAKE_USER
#   SNOWFLAKE_PASSWORD
#   SNOWFLAKE_DATABASE   e.g. PHARMACY
#   SNOWFLAKE_SCHEMA     e.g. PUBLIC
#   SNOWFLAKE_WAREHOUSE  e.g. COMPUTE_WH
#   SNOWFLAKE_ROLE       optional
#
# Alternatively set SNOWFLAKE_URL directly, e.g.
#   snowflake://user:pass@account/PHARMACY/PUBLIC?warehouse=COMPUTE_WH&role=SYSADMIN


def _build_url() -> str:
    explicit = os.getenv("SNOWFLAKE_URL")
    if explicit:
        return explicit

    account = os.getenv("SNOWFLAKE_ACCOUNT")
    user = os.getenv("SNOWFLAKE_USER")
    password = os.getenv("SNOWFLAKE_PASSWORD")
    database = os.getenv("SNOWFLAKE_DATABASE", "PHARMACY")
    schema = os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC")
    warehouse = os.getenv("SNOWFLAKE_WAREHOUSE")
    role = os.getenv("SNOWFLAKE_ROLE")

    missing = [
        name
        for name, value in (
            ("SNOWFLAKE_ACCOUNT", account),
            ("SNOWFLAKE_USER", user),
            ("SNOWFLAKE_PASSWORD", password),
            ("SNOWFLAKE_WAREHOUSE", warehouse),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(
            "Missing Snowflake environment variables: " + ", ".join(missing)
        )

    url = (
        f"snowflake://{quote_plus(user)}:{quote_plus(password)}"
        f"@{account}/{database}/{schema}?warehouse={warehouse}"
    )
    if role:
        url += f"&role={role}"
    return url


SQLALCHEMY_DATABASE_URL = _build_url()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    # Snowflake charges per-second warehouse time; recycle idle connections.
    pool_recycle=1800,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()