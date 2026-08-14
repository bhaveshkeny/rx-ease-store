# MediCare Pharmacy — Backend (Python FastAPI + SQLite)

Standalone FastAPI service that mirrors the storefront's backend: accounts, medicine
catalogue, orders, prescription uploads and a pharmacist verification queue.

## Run locally

```sh
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- SQLite file `pharmacy.db` is created on first boot and seeded with 18 medicines.
- Prescription files are stored under `backend/uploads/prescriptions/<user_id>/`.

Set `SECRET_KEY` (JWT signing) and `CORS_ORIGINS` as environment variables in production.

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
    database.py    SQLite engine + session dependency
    models.py      users, medicines, orders, order_items
    schemas.py     Pydantic request/response models
    auth.py        password hashing, JWT, current-user dependencies
    seed.py        starter catalogue
    routers/       auth_routes.py, medicines.py, orders.py
```

> The React frontend in this repo lives in `src/` and currently runs against the
> hosted managed backend. To run fully local, swap its data calls for `fetch`
> calls to this API as shown above.
