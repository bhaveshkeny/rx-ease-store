import io


def _order_payload(medicine_id, quantity=1):
    return {
        "full_name": "Test Patient",
        "phone": "0700000000",
        "address": "1 Test Street",
        "items": [{"medicine_id": medicine_id, "quantity": quantity}],
    }


def test_create_order_requires_auth(client, otc_medicine):
    assert client.post("/api/orders", json=_order_payload(otc_medicine.id)).status_code == 401


def test_otc_order_totals_include_delivery_under_30(client, auth_headers, otc_medicine):
    res = client.post("/api/orders", json=_order_payload(otc_medicine.id, 2), headers=auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["total"] == 23.99  # 2 x 10.00 + 3.99 delivery
    assert body["status"] == "placed"
    assert body["items"][0]["quantity"] == 2
    assert body["items"][0]["unit_price"] == 10.0


def test_free_delivery_over_30(client, auth_headers, otc_medicine):
    res = client.post("/api/orders", json=_order_payload(otc_medicine.id, 4), headers=auth_headers)
    assert res.json()["total"] == 40.0


def test_rx_order_awaits_verification(client, auth_headers, rx_medicine):
    res = client.post("/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["status"] == "awaiting_verification"


def test_order_decrements_stock(client, db, auth_headers, otc_medicine):
    client.post("/api/orders", json=_order_payload(otc_medicine.id, 3), headers=auth_headers)
    db.expire_all()
    assert db.get(type(otc_medicine), otc_medicine.id).stock == 47


def test_order_rejects_insufficient_stock(client, auth_headers, rx_medicine):
    res = client.post("/api/orders", json=_order_payload(rx_medicine.id, 99), headers=auth_headers)
    assert res.status_code == 409
    assert "out of stock" in res.json()["detail"]


def test_order_rejects_unknown_medicine(client, auth_headers):
    res = client.post("/api/orders", json=_order_payload("missing-id"), headers=auth_headers)
    assert res.status_code == 404


def test_order_rejects_empty_basket(client, auth_headers):
    payload = _order_payload("x")
    payload["items"] = []
    res = client.post("/api/orders", json=payload, headers=auth_headers)
    assert res.status_code == 400


def test_order_rejects_zero_quantity(client, auth_headers, otc_medicine):
    res = client.post("/api/orders", json=_order_payload(otc_medicine.id, 0), headers=auth_headers)
    assert res.status_code == 400


def test_my_orders_only_returns_own_orders(client, auth_headers, otc_medicine):
    from tests.conftest import register

    client.post("/api/orders", json=_order_payload(otc_medicine.id), headers=auth_headers)
    other = {"Authorization": f"Bearer {register(client, email='other@example.com')}"}

    mine = client.get("/api/orders", headers=auth_headers).json()
    theirs = client.get("/api/orders", headers=other).json()
    assert len(mine) == 1
    assert theirs == []


def test_prescription_upload_and_download(client, auth_headers, rx_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers
    ).json()["id"]

    res = client.post(
        f"/api/orders/{order_id}/prescription",
        files={"file": ("rx.png", io.BytesIO(b"fake-png-bytes"), "image/png")},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["prescription_path"].endswith("rx.png")

    download = client.get(f"/api/orders/{order_id}/prescription", headers=auth_headers)
    assert download.status_code == 200
    assert download.content == b"fake-png-bytes"


def test_prescription_upload_rejects_bad_mime(client, auth_headers, rx_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers
    ).json()["id"]
    res = client.post(
        f"/api/orders/{order_id}/prescription",
        files={"file": ("rx.exe", io.BytesIO(b"MZ"), "application/octet-stream")},
        headers=auth_headers,
    )
    assert res.status_code == 415


def test_prescription_upload_on_other_users_order_is_404(client, auth_headers, rx_medicine):
    from tests.conftest import register

    order_id = client.post(
        "/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers
    ).json()["id"]
    other = {"Authorization": f"Bearer {register(client, email='intruder@example.com')}"}
    res = client.post(
        f"/api/orders/{order_id}/prescription",
        files={"file": ("rx.png", io.BytesIO(b"x"), "image/png")},
        headers=other,
    )
    assert res.status_code == 404


def test_download_missing_prescription_is_404(client, auth_headers, otc_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(otc_medicine.id), headers=auth_headers
    ).json()["id"]
    assert client.get(f"/api/orders/{order_id}/prescription", headers=auth_headers).status_code == 404


def test_pharmacist_can_download_any_prescription(client, auth_headers, pharmacist_headers, rx_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers
    ).json()["id"]
    client.post(
        f"/api/orders/{order_id}/prescription",
        files={"file": ("rx.pdf", io.BytesIO(b"%PDF-1.4"), "application/pdf")},
        headers=auth_headers,
    )
    res = client.get(f"/api/orders/{order_id}/prescription", headers=pharmacist_headers)
    assert res.status_code == 200


def test_verification_queue_requires_pharmacist(client, auth_headers, rx_medicine):
    client.post("/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers)
    assert client.get("/api/orders/pharmacy/queue").status_code == 401
    assert client.get("/api/orders/pharmacy/queue", headers=auth_headers).status_code == 403


def test_verification_queue_lists_rx_orders(client, auth_headers, pharmacist_headers, rx_medicine, otc_medicine):
    client.post("/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers)
    client.post("/api/orders", json=_order_payload(otc_medicine.id), headers=auth_headers)
    queue = client.get("/api/orders/pharmacy/queue", headers=pharmacist_headers).json()
    assert len(queue) == 1
    assert queue[0]["status"] == "awaiting_verification"


def test_pharmacist_can_update_status(client, auth_headers, pharmacist_headers, rx_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(rx_medicine.id), headers=auth_headers
    ).json()["id"]

    res = client.patch(
        f"/api/orders/{order_id}/status", json={"status": "dispensed"}, headers=pharmacist_headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "dispensed"
    assert client.get("/api/orders", headers=auth_headers).json()[0]["status"] == "dispensed"


def test_status_update_validation_and_permissions(client, auth_headers, pharmacist_headers, otc_medicine):
    order_id = client.post(
        "/api/orders", json=_order_payload(otc_medicine.id), headers=auth_headers
    ).json()["id"]

    assert client.patch(
        f"/api/orders/{order_id}/status", json={"status": "teleported"}, headers=pharmacist_headers
    ).status_code == 400
    assert client.patch(
        f"/api/orders/{order_id}/status", json={"status": "dispensed"}, headers=auth_headers
    ).status_code == 403
    assert client.patch(
        "/api/orders/missing/status", json={"status": "dispensed"}, headers=pharmacist_headers
    ).status_code == 404
