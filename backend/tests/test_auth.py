def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_register_returns_token(client):
    res = client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "password": "Passw0rd!", "full_name": "New User"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "password": "Passw0rd!"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 400
    assert res.json()["detail"] == "Email already registered"


def test_register_invalid_email_rejected(client):
    res = client.post("/api/auth/register", json={"email": "not-an-email", "password": "x"})
    assert res.status_code == 422


def test_login_success_and_wrong_password(client):
    client.post("/api/auth/register", json={"email": "log@example.com", "password": "Passw0rd!"})

    ok = client.post("/api/auth/login", data={"username": "log@example.com", "password": "Passw0rd!"})
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = client.post("/api/auth/login", data={"username": "log@example.com", "password": "wrong"})
    assert bad.status_code == 401

    unknown = client.post("/api/auth/login", data={"username": "ghost@example.com", "password": "x"})
    assert unknown.status_code == 401


def test_password_is_hashed(client, db):
    from app.models import User

    client.post("/api/auth/register", json={"email": "hash@example.com", "password": "Passw0rd!"})
    user = db.query(User).filter(User.email == "hash@example.com").one()
    assert user.hashed_password != "Passw0rd!"
    assert user.hashed_password.startswith("$2")


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_me_returns_profile(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "patient@example.com"
    assert body["is_pharmacist"] is False
    assert "hashed_password" not in body
