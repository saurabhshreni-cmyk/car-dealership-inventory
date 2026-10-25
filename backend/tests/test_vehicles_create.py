import pytest

VEHICLE = {"make": "Toyota", "model": "Camry", "category": "Sedan", "price": 25000.5, "quantity": 3}


def test_create_requires_authentication(client):
    assert client.post("/api/vehicles", json=VEHICLE).status_code == 401


def test_create_rejects_invalid_token(client):
    response = client.post("/api/vehicles", json=VEHICLE, headers={"Authorization": "Bearer garbage"})

    assert response.status_code == 401


def test_create_is_forbidden_for_normal_user(client, auth_headers):
    response = client.post("/api/vehicles", json=VEHICLE, headers=auth_headers("user"))

    assert response.status_code == 403


def test_admin_can_create_vehicle(client, auth_headers):
    response = client.post("/api/vehicles", json=VEHICLE, headers=auth_headers("admin"))

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert {k: body[k] for k in VEHICLE} == VEHICLE


def test_created_vehicles_get_unique_ids(client, auth_headers):
    headers = auth_headers("admin")

    first = client.post("/api/vehicles", json=VEHICLE, headers=headers).json()["id"]
    second = client.post("/api/vehicles", json=VEHICLE, headers=headers).json()["id"]

    assert first != second


@pytest.mark.parametrize(
    "patch",
    [{"price": 0}, {"price": -1}, {"quantity": -1}, {"make": ""}, {"model": "  "}, {"category": ""}, {"quantity": "x"}],
)
def test_create_validates_payload(client, auth_headers, patch):
    response = client.post("/api/vehicles", json={**VEHICLE, **patch}, headers=auth_headers("admin"))

    assert response.status_code == 422
