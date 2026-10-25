import pytest


def restock(client, vehicle_id, amount, headers=None):
    return client.post(f"/api/vehicles/{vehicle_id}/restock", json={"amount": amount}, headers=headers)


def test_restock_requires_authentication(client, stock):
    assert restock(client, stock().id, 5).status_code == 401


def test_restock_is_forbidden_for_normal_user(client, auth_headers, stock):
    assert restock(client, stock().id, 5, auth_headers("user")).status_code == 403


def test_admin_restock_increases_quantity(client, auth_headers, stock):
    vehicle = stock(quantity=2)

    response = restock(client, vehicle.id, 5, auth_headers("admin"))

    assert response.status_code == 200
    assert response.json()["quantity"] == 7
    assert response.json()["id"] == vehicle.id


def test_restock_accumulates_and_unblocks_sold_out_vehicle(client, auth_headers, stock):
    vehicle = stock(quantity=0)
    admin = auth_headers("admin")
    restock(client, vehicle.id, 1, admin)
    restock(client, vehicle.id, 2, admin)

    purchase = client.post(f"/api/vehicles/{vehicle.id}/purchase", headers=auth_headers("user"))

    assert purchase.status_code == 201
    assert client.get("/api/vehicles", headers=admin).json()[0]["quantity"] == 2


@pytest.mark.parametrize("amount", [0, -3, 1.5, "ten"])
def test_restock_requires_positive_integer(client, auth_headers, stock, amount):
    response = restock(client, stock().id, amount, auth_headers("admin"))

    assert response.status_code == 422


def test_restock_unknown_vehicle_is_404(client, auth_headers):
    response = restock(client, 999, 5, auth_headers("admin"))

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"
