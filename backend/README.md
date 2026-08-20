# Rx-Ease Pharmacy Backend — FastAPI + Neon Postgres + Vercel

This backend is prepared for deployment as a Vercel Python Function with Neon PostgreSQL.

## What was changed

- Replaced SQLite with PostgreSQL through `DATABASE_URL`.
- Added Psycopg 3 for PostgreSQL.
- Added `api/index.py` as the Vercel FastAPI entry point.
- Added `vercel.json`.
- Removed the local SQLite database, `.venv`, tests and uploaded prescription files from the deployment package.
- Prescription uploads are stored in Neon instead of the Vercel filesystem, because Vercel function storage is not persistent.
- Kept the existing `/api/auth`, `/api/medicines`, and `/api/orders` routes.

## Local setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and put your Neon connection string in `DATABASE_URL`.

Run:

```powershell
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

## Vercel entry point

Vercel uses `api/index.py` and the exported `app` FastAPI application.

The API will be available under:

```text
https://YOUR-BACKEND.vercel.app/api/health
https://YOUR-BACKEND.vercel.app/docs
```

## Important

Do not upload `.env` to GitHub. Add the environment variables in Vercel.

For a separate React Vercel project, set:

```text
DATABASE_URL=<Neon connection string>
SECRET_KEY=<strong random secret>
CORS_ORIGINS=https://YOUR-FRONTEND.vercel.app
AUTO_INIT_DB=true
```

If frontend and backend are deployed under the same Vercel project/domain, CORS is normally unnecessary.

## Database initialization

With `AUTO_INIT_DB=true`, the first Vercel invocation creates the SQLAlchemy tables and inserts the starter medicines/users if the tables are empty.

For a production application, use migrations (Alembic) rather than relying on `create_all()`.

## Prescription storage

Prescription files are stored as PostgreSQL binary data. This makes the current project work on Vercel without a local filesystem dependency.

For a larger production pharmacy application, move prescription files to object storage such as Vercel Blob/S3 and keep only the object URL/key in Postgres.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/medicines`
- `GET /api/medicines/categories`
- `GET /api/medicines/{id}`
- `POST /api/medicines`
- `POST /api/orders`
- `GET /api/orders`
- `POST /api/orders/{id}/prescription`
- `GET /api/orders/{id}/prescription`
- `GET /api/orders/pharmacy/queue`
- `PATCH /api/orders/{id}/status`
