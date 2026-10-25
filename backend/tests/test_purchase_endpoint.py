def buy(client, vehicle_id, headers=None):
    return client.post(f"/api/vehicles/{vehicle_id}/purchase", headers=headers)


def quantity_of(client, vehicle_id, headers):
    return next(v["quantity"] for v in client.get("/api/vehicles", headers=headers).json() if v["id"] == vehicle_id)


def test_purchase_requires_authentication(client, stock):
    assert buy(client, stock().id).status_code == 401


def test_purchase_decreases_quantity_and_returns_receipt(client, auth_headers, stock):
    vehicle = stock(make="Honda", model="Civic", price=22000.5, quantity=2)
    headers = auth_headers("user")

    response = buy(client, vehicle.id, headers)

    assert response.status_code == 201
    body = response.json()
    assert body["vehicle_id"] == vehicle.id
    assert (body["make"], body["model"], body["price"]) == ("Honda", "Civic", 22000.5)
    assert quantity_of(client, vehicle.id, headers) == 1


def test_purchase_out_of_stock_is_conflict(client, auth_headers, stock):
    vehicle = stock(quantity=1)
    headers = auth_headers("user")
    assert buy(client, vehicle.id, headers).status_code == 201

    response = buy(client, vehicle.id, headers)

    assert response.status_code == 409
    assert quantity_of(client, vehicle.id, headers) == 0


def test_purchase_unknown_vehicle_is_404(client, auth_headers):
    response = buy(client, 999, auth_headers("user"))

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"


def test_admin_can_also_purchase(client, auth_headers, stock):
    assert buy(client, stock().id, auth_headers("admin")).status_code == 201
