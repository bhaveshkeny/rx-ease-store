import secrets

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .database import Base, engine
from .config import API_KEY, AUTO_INIT_DB, CORS_ORIGINS
from .routers import auth_routes, medicines, orders, support
from .seed import seed_medicines,seed_users

app = FastAPI(
    title="MediCare Pharmacy API",
    description="FastAPI + Snowflake backend for the MediCare pharmacy storefront.",
    version="1.0.0",
)

origins = [
    origin.strip()
    for origin in CORS_ORIGINS.split(",")
    if origin.strip()
]

# origins = CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def require_api_key(request: Request, call_next) -> Response:
    if not request.url.path.startswith("/api/"):
        return await call_next(request)
    if request.url.path == "/api/health" or request.method == "OPTIONS":
        return await call_next(request)
    if not API_KEY:
        return JSONResponse(status_code=503, content={"detail": "API key is not configured"})
    supplied_key = request.headers.get("X-API-Key", "")
    if not secrets.compare_digest(supplied_key, API_KEY):
        return JSONResponse(status_code=401, content={"detail": "Invalid or missing API key"})
    return await call_next(request)

app.include_router(auth_routes.router)
app.include_router(medicines.router)
app.include_router(orders.router)
app.include_router(support.router)


@app.on_event("startup")
def on_startup() -> None:
    if AUTO_INIT_DB:
        Base.metadata.create_all(bind=engine)
        seed_medicines()
        seed_users()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
