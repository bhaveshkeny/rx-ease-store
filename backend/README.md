# MediCare Pharmacy — Backend (Python FastAPI + Snowflake)

Standalone FastAPI service that mirrors the storefront's backend: accounts, medicine
catalogue, orders, prescription uploads and a pharmacist verification queue.
Data lives in Snowflake via SQLAlchemy (`snowflake-sqlalchemy`).

## 1. Prepare Snowflake

Run `snowflake_setup.sql` in a worksheet to create the warehouse, database and schema
(and grant your app role access). Tables are created automatically on first boot.

## 2. Configure credentials

```sh
export SNOWFLAKE_ACCOUNT=ab12345.eu-west-1   # account identifier
export SNOWFLAKE_USER=pharmacy_app
export SNOWFLAKE_PASSWORD=•••••
export SNOWFLAKE_DATABASE=PHARMACY
export SNOWFLAKE_SCHEMA=PUBLIC
export SNOWFLAKE_WAREHOUSE=COMPUTE_WH
export SNOWFLAKE_ROLE=SYSADMIN               # optional
export SECRET_KEY=change-me                  # JWT signing
# Add the exact deployed frontend origin here, separated by commas.
# Example: https://rx-ease.example.com,http://localhost:5173
export CORS_ORIGINS=https://rx-ease.example.com,http://localhost:5173
```

Alternatively set a single `SNOWFLAKE_URL`:
`snowflake://user:pass@account/PHARMACY/PUBLIC?warehouse=COMPUTE_WH&role=SYSADMIN`
(URL-encode special characters in the password). For key-pair auth, pass
`connect_args={"private_key": ...}` in `app/database.py`.

## 3. Run locally

```sh
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- On first boot the tables are created in `PHARMACY.PUBLIC` and seeded with 18 medicines.
- Prescription files are stored on disk under `backend/uploads/prescriptions/<user_id>/`
  (Snowflake stores only the relative path; swap in a stage/S3 for production).

Notes for Snowflake: indexes are not used (Snowflake has none), keys/constraints are
declared but not enforced, and the warehouse auto-suspends when idle.


## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create an account, returns JWT |
| POST | `/api/auth/login` | – | OAuth2 password form login (`username` = email) |
| GET | `/api/auth/me` | user | Current profile |
| GET | `/api/medicines` | – | Catalogue with `search`, `category`, `rx_only` filters |
| GET | `/api/medicines/categories` | – | Distinct categories |
| GET | `/api/medicines/{id}` | – | Single medicine |
| POST | `/api/medicines` | pharmacist | Add a medicine |
| POST | `/api/orders` | user | Place order (server prices items, decrements stock) |
| GET | `/api/orders` | user | Own order history |
| POST | `/api/orders/{id}/prescription` | owner | Upload JPG/PNG/PDF (max 10 MB) |
| GET | `/api/orders/{id}/prescription` | owner or pharmacist | Download prescription |
| GET | `/api/orders/pharmacy/queue` | pharmacist | Orders awaiting verification |
| PATCH | `/api/orders/{id}/status` | pharmacist | `placed`/`awaiting_verification`/`dispensed`/`delivered`/`cancelled` |

Orders containing an Rx medicine are created as `awaiting_verification`; everything
else as `placed`. Delivery is £3.99 under a £30 subtotal, free above.

## Making a pharmacist

```sh
python -c "from app.database import SessionLocal; from app.models import User; \
db=SessionLocal(); u=db.query(User).filter_by(email='you@example.com').first(); \
u.is_pharmacist=True; db.commit()"
```

## Pointing a React frontend at this API

```ts
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const res = await fetch(`${API}/api/medicines`);
const medicines = await res.json();

// authenticated calls
fetch(`${API}/api/orders`, { headers: { Authorization: `Bearer ${token}` } });
```

For a deployed frontend, set `VITE_API_URL` in the frontend hosting environment
to the public FastAPI URL, and set `CORS_ORIGINS` in the backend environment to
the frontend origin, for example:

```text
Frontend: VITE_API_URL=https://api.example.com
Backend:  CORS_ORIGINS=https://rx-ease.example.com
```

The frontend origin must match the browser origin exactly, including `https://`,
but must not include a path such as `/app`.

Login uses form encoding:

```ts
await fetch(`${API}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ username: email, password }),
});
```

## Folder layout

```
backend/
  requirements.txt
  app/
    main.py        FastAPI app, CORS, startup (create tables + seed)
    database.py    Snowflake engine + session dependency
    models.py      users, medicines, orders, order_items
    schemas.py     Pydantic request/response models
    auth.py        password hashing, JWT, current-user dependencies
    seed.py        starter catalogue
    routers/       auth_routes.py, medicines.py, orders.py
```

> The React frontend in this repo lives in `src/` and currently runs against the
> hosted managed backend. To run fully local, swap its data calls for `fetch`
> calls to this API as shown above.
