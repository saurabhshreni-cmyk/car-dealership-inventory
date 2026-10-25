"""Audit-driven edge cases across auth, admin protection, injection and data integrity."""
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from sqlalchemy import func, select

from app.config import get_settings
from app.models.purchase import Purchase
from app.models.vehicle import Vehicle

VEHICLE = {"make": "Toyota", "model": "Camry", "category": "Sedan", "price": 25000, "quantity": 3}

ADMIN_ENDPOINTS = [
    ("POST", "/api/vehicles", VEHICLE),
    ("PUT", "/api/vehicles/{id}", VEHICLE),
    ("DELETE", "/api/vehicles/{id}", None),
    ("POST", "/api/vehicles/{id}/restock", {"amount": 5}),
]


def _token(payload: dict, secret: str | None = None, algorithm: str = "HS256") -> dict:
    token = jwt.encode(payload, secret or get_settings().jwt_secret_key, algorithm=algorithm)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize(("method", "path", "body"), ADMIN_ENDPOINTS)
def test_every_admin_endpoint_rejects_anonymous_and_normal_users_without_side_effects(
    client, auth_headers, stock, session, method, path, body
):
    vehicle = stock(quantity=3)
    url = path.format(id=vehicle.id)

    anonymous = client.request(method, url, json=body)
    normal_user = client.request(method, url, json=body, headers=auth_headers("user"))

    assert anonymous.status_code == 401
    assert normal_user.status_code == 403
    assert session.scalar(select(func.count()).select_from(Vehicle)) == 1
    session.expire_all()
    assert session.get(Vehicle, vehicle.id).quantity == 3


def test_registering_with_admin_flags_never_yields_admin_access(client):
    body = {"email": "sneaky@example.com", "password": "correct-horse", "role": "admin", "is_admin": True}

    registered = client.post("/api/auth/register", json=body)
    token = client.post("/api/auth/login", json={"email": "sneaky@example.com", "password": "correct-horse"}).json()
    created = client.post(
        "/api/vehicles", json=VEHICLE, headers={"Authorization": f"Bearer {token['access_token']}"}
    )

    assert registered.json()["role"] == "user"
    assert token["user"]["role"] == "user"
    assert created.status_code == 403


def test_expired_token_is_rejected_by_protected_endpoints(client, create_user):
    user = create_user("late@example.com")
    headers = _token({"sub": str(user.id), "exp": datetime.now(timezone.utc) - timedelta(seconds=5)})

    assert client.get("/api/vehicles", headers=headers).status_code == 401


def test_tampered_token_signature_is_rejected(client, create_user):
    user = create_user("tamper@example.com")
    good = _token({"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(minutes=5)})
    token = good["Authorization"].removeprefix("Bearer ")
    flipped = token[:-2] + ("AA" if not token.endswith("AA") else "BB")

    assert client.get("/api/vehicles", headers={"Authorization": f"Bearer {flipped}"}).status_code == 401


def test_token_for_a_deleted_user_is_rejected(client, create_user, session):
    user = create_user("ghost@example.com")
    headers = _token({"sub": str(user.id), "exp": datetime.now(timezone.utc) + timedelta(minutes=5)})
    session.delete(user)
    session.commit()

    assert client.get("/api/vehicles", headers=headers).status_code == 401


def test_admin_claim_inside_the_token_is_ignored(client, create_user):
    user = create_user("claims@example.com", role="user")
    headers = _token(
        {"sub": str(user.id), "role": "admin", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    )

    assert client.post("/api/vehicles", json=VEHICLE, headers=headers).status_code == 403


@pytest.mark.parametrize("scheme", ["Token", "Basic", "bearer-ish"])
def test_non_bearer_authorization_headers_are_rejected(client, auth_headers, scheme):
    token = auth_headers("user")["Authorization"].removeprefix("Bearer ")

    assert client.get("/api/vehicles", headers={"Authorization": f"{scheme} {token}"}).status_code == 401


@pytest.mark.parametrize("payload", ["' OR '1'='1", "'; DROP TABLE vehicles; --", "%' OR 1=1 --"])
def test_search_is_safe_against_sql_injection_strings(client, auth_headers, stock, payload):
    stock()
    headers = auth_headers("user")

    searched = client.get("/api/vehicles/search", params={"make": payload, "model": payload}, headers=headers)

    assert searched.status_code == 200
    assert searched.json() == []
    assert len(client.get("/api/vehicles", headers=headers).json()) == 1


def test_sold_out_vehicle_cannot_be_purchased_repeatedly_and_leaves_no_receipts(client, auth_headers, stock, session):
    vehicle = stock(quantity=0)
    headers = auth_headers("user")

    statuses = [client.post(f"/api/vehicles/{vehicle.id}/purchase", headers=headers).status_code for _ in range(3)]

    assert statuses == [409, 409, 409]
    assert session.scalar(select(func.count()).select_from(Purchase)) == 0
    session.expire_all()
    assert session.get(Vehicle, vehicle.id).quantity == 0


def test_deleting_a_vehicle_keeps_every_buyers_receipt(client, auth_headers, stock, session):
    vehicle = stock("Ford", "F-150", quantity=2)
    alice, bob = auth_headers("user", "alice@example.com"), auth_headers("user", "bob@example.com")
    client.post(f"/api/vehicles/{vehicle.id}/purchase", headers=alice)
    client.post(f"/api/vehicles/{vehicle.id}/purchase", headers=bob)

    deleted = client.delete(f"/api/vehicles/{vehicle.id}", headers=auth_headers("admin"))

    assert deleted.status_code == 204
    assert session.scalar(select(func.count()).select_from(Purchase)) == 2
    for headers in (alice, bob):
        receipts = client.get("/api/purchases/me", headers=headers).json()
        assert [(r["make"], r["model"], r["vehicle_id"]) for r in receipts] == [("Ford", "F-150", None)]


def test_duplicate_registration_does_not_overwrite_the_original_password(client):
    client.post("/api/auth/register", json={"email": "twin@example.com", "password": "original-pass"})

    second = client.post("/api/auth/register", json={"email": "twin@example.com", "password": "attacker-pass"})
    original = client.post("/api/auth/login", json={"email": "twin@example.com", "password": "original-pass"})
    attacker = client.post("/api/auth/login", json={"email": "twin@example.com", "password": "attacker-pass"})

    assert second.status_code == 409
    assert (original.status_code, attacker.status_code) == (200, 401)
