"""Inputs beyond a 32-bit INTEGER column must be rejected with 422, never reach the database."""
import pytest

INT32_MAX = 2_147_483_647
VEHICLE = {"make": "Toyota", "model": "Camry", "category": "Sedan", "price": 25000, "quantity": 3}


def test_create_rejects_quantity_above_the_cap(client, auth_headers):
    response = client.post("/api/vehicles", json={**VEHICLE, "quantity": 1_000_001}, headers=auth_headers("admin"))

    assert response.status_code == 422


def test_create_accepts_quantity_at_the_cap(client, auth_headers):
    response = client.post("/api/vehicles", json={**VEHICLE, "quantity": 1_000_000}, headers=auth_headers("admin"))

    assert response.status_code == 201


def test_restock_rejects_amount_above_the_cap(client, auth_headers, stock):
    response = client.post(
        f"/api/vehicles/{stock().id}/restock", json={"amount": 1_000_001}, headers=auth_headers("admin")
    )

    assert response.status_code == 422


def test_create_rejects_price_with_too_many_digits(client, auth_headers):
    response = client.post("/api/vehicles", json={**VEHICLE, "price": 10**10}, headers=auth_headers("admin"))

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("put", "/api/vehicles/{id}", VEHICLE),
        ("delete", "/api/vehicles/{id}", None),
        ("post", "/api/vehicles/{id}/purchase", None),
        ("post", "/api/vehicles/{id}/restock", {"amount": 1}),
    ],
)
@pytest.mark.parametrize("vehicle_id", [0, -1, INT32_MAX + 1, 99_999_999_999])
def test_vehicle_id_outside_the_integer_range_is_422(client, auth_headers, method, path, body, vehicle_id):
    response = client.request(
        method.upper(), path.format(id=vehicle_id), json=body, headers=auth_headers("admin")
    )

    assert response.status_code == 422
