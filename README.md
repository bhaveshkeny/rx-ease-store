# RxEase Pharmacy API

This repository is currently deployed as a backend-only FastAPI service. The
frontend source remains in `src/` for reference, but it is not part of the
backend deployment.

## Run locally

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API documentation is available at `http://localhost:8000/docs`.

## Deploy to Vercel

Create a Vercel project from this repository and set its **Root Directory** to
`backend`. Vercel will detect `api/index.py` as the Python function entrypoint.

Set these Vercel environment variables for Production and Preview as needed:

```text
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
SECRET_KEY=<long-random-private-value>
CORS_ORIGINS=https://your-frontend-domain.example
```

The PostgreSQL database must be reachable from Vercel. Tables are created and
starter medicines/users are seeded on backend startup.

See [backend/README.md](backend/README.md) for the complete API reference.
