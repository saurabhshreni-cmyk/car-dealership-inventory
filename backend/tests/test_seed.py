import pytest
from sqlalchemy import func, select

from app.config import Settings
from app.models.user import User
from app.models.vehicle import Vehicle
from app.seed import SeedConfigError, run_seed

ADMIN = {"admin_email": "Boss@Example.com", "admin_password": "admin-password-1"}


def settings(**overrides) -> Settings:
    return Settings(jwt_secret_key="x" * 32, **overrides)


def test_seed_creates_admin_who_can_log_in(client, session):
    run_seed(settings(**ADMIN))

    response = client.post("/api/auth/login", json={"email": "boss@example.com", "password": "admin-password-1"})

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "admin"


def test_seed_is_idempotent(session):
    run_seed(settings(**ADMIN))
    run_seed(settings(**ADMIN))

    assert session.scalar(select(func.count()).select_from(User)) == 1
    vehicles = session.scalar(select(func.count()).select_from(Vehicle))
    run_seed(settings(**ADMIN))
    assert session.scalar(select(func.count()).select_from(Vehicle)) == vehicles


def test_seed_inserts_demo_vehicles_including_a_sold_out_one(session):
    run_seed(settings(**ADMIN))

    quantities = list(session.scalars(select(Vehicle.quantity)))
    assert len(quantities) >= 8
    assert 0 in quantities


def test_seed_does_not_touch_existing_vehicles(session, stock):
    stock("Lada", "Niva", "SUV", 9000, 1)

    run_seed(settings(**ADMIN))

    assert list(session.scalars(select(Vehicle.make))) == ["Lada"]


def test_seed_promotes_existing_user_to_admin(client, session):
    client.post("/api/auth/register", json={"email": "boss@example.com", "password": "other-password"})

    run_seed(settings(**ADMIN))

    session.expire_all()
    assert session.scalar(select(User.role).where(User.email == "boss@example.com")) == "admin"


@pytest.mark.parametrize("overrides", [{}, {"admin_email": "a@example.com"}, {"admin_password": "password123"}])
def test_seed_requires_admin_credentials_from_env(overrides):
    with pytest.raises(SeedConfigError):
        run_seed(settings(**overrides))
