import pytest

NEW = {"make": "Honda", "model": "Accord", "category": "Sedan", "price": 28000, "quantity": 7}


def test_update_requires_authentication(client, stock):
    vehicle = stock()

    assert client.put(f"/api/vehicles/{vehicle.id}", json=NEW).status_code == 401


def test_update_is_forbidden_for_normal_user(client, auth_headers, stock):
    vehicle = stock()

    response = client.put(f"/api/vehicles/{vehicle.id}", json=NEW, headers=auth_headers("user"))

    assert response.status_code == 403


def test_admin_can_update_vehicle(client, auth_headers, stock):
    vehicle = stock()
    headers = auth_headers("admin")

    response = client.put(f"/api/vehicles/{vehicle.id}", json=NEW, headers=headers)

    assert response.status_code == 200
    assert response.json() == {"id": vehicle.id, **NEW}
    listed = client.get("/api/vehicles", headers=headers).json()
    assert listed == [{"id": vehicle.id, **NEW}]


def test_update_unknown_vehicle_is_404(client, auth_headers):
    response = client.put("/api/vehicles/999", json=NEW, headers=auth_headers("admin"))

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"


@pytest.mark.parametrize("patch", [{"price": -5}, {"quantity": -1}, {"make": ""}])
def test_update_validates_payload(client, auth_headers, stock, patch):
    vehicle = stock()

    response = client.put(f"/api/vehicles/{vehicle.id}", json={**NEW, **patch}, headers=auth_headers("admin"))

    assert response.status_code == 422


def test_delete_requires_authentication(client, stock):
    assert client.delete(f"/api/vehicles/{stock().id}").status_code == 401


def test_delete_is_forbidden_for_normal_user(client, auth_headers, stock):
    vehicle = stock()

    assert client.delete(f"/api/vehicles/{vehicle.id}", headers=auth_headers("user")).status_code == 403


def test_admin_can_delete_vehicle(client, auth_headers, stock):
    vehicle = stock()
    headers = auth_headers("admin")

    response = client.delete(f"/api/vehicles/{vehicle.id}", headers=headers)

    assert response.status_code == 204
    assert client.get("/api/vehicles", headers=headers).json() == []


def test_delete_unknown_vehicle_is_404(client, auth_headers):
    response = client.delete("/api/vehicles/999", headers=auth_headers("admin"))

    assert response.status_code == 404
    assert response.json()["detail"] == "Vehicle not found"
