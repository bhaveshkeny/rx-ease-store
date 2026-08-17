def test_catalogue_is_seeded_on_startup(client):
    res = client.get("/api/medicines")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 18
    assert any(m["requires_prescription"] for m in items)
    assert any(not m["requires_prescription"] for m in items)


def test_search_filter(client):
    res = client.get("/api/medicines", params={"search": "paracetamol"})
    assert res.status_code == 200
    names = [m["name"].lower() for m in res.json()]
    assert names and all("paracetamol" in n for n in names)


def test_category_filter(client):
    res = client.get("/api/medicines", params={"category": "Vitamins"})
    assert res.status_code == 200
    assert res.json()
    assert all(m["category"] == "Vitamins" for m in res.json())


def test_rx_only_filter(client):
    rx = client.get("/api/medicines", params={"rx_only": True}).json()
    otc = client.get("/api/medicines", params={"rx_only": False}).json()
    assert rx and otc
    assert all(m["requires_prescription"] for m in rx)
    assert all(not m["requires_prescription"] for m in otc)


def test_categories_endpoint_is_sorted_and_unique(client):
    cats = client.get("/api/medicines/categories").json()
    assert cats == sorted(set(cats))


def test_get_medicine_by_id(client):
    first = client.get("/api/medicines").json()[0]
    res = client.get(f"/api/medicines/{first['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == first["id"]


def test_get_missing_medicine_returns_404(client):
    res = client.get("/api/medicines/does-not-exist")
    assert res.status_code == 404


def test_create_medicine_requires_pharmacist(client, auth_headers):
    payload = {"name": "Unauthorised", "category": "Pain Relief", "price": 1.0}
    assert client.post("/api/medicines", json=payload).status_code == 401
    res = client.post("/api/medicines", json=payload, headers=auth_headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Pharmacist access required"


def test_pharmacist_can_create_medicine(client, pharmacist_headers):
    payload = {
        "name": "New Ointment",
        "brand": "TestBrand",
        "category": "Skin Care",
        "price": 4.5,
        "pack_size": "30 g",
        "requires_prescription": False,
        "stock": 12,
    }
    res = client.post("/api/medicines", json=payload, headers=pharmacist_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["id"]
    assert body["name"] == "New Ointment"
    assert client.get(f"/api/medicines/{body['id']}").status_code == 200
