"""Seed script: creates the admin account from env vars and demo vehicles.

Usage:  python -m app.seed      (needs ADMIN_EMAIL and ADMIN_PASSWORD)
"""
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_session_factory, init_db
from app.models.user import Role
from app.repositories.user_repository import UserRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.auth_service import normalise_email
from app.services.security import hash_password

DEMO_VEHICLES = [
    {"make": "Toyota", "model": "Camry", "category": "Sedan", "price": 27500, "quantity": 6},
    {"make": "Honda", "model": "Civic", "category": "Sedan", "price": 24200, "quantity": 9},
    {"make": "Toyota", "model": "RAV4", "category": "SUV", "price": 32900, "quantity": 4},
    {"make": "Subaru", "model": "Outback", "category": "SUV", "price": 35400, "quantity": 0},
    {"make": "Ford", "model": "F-150", "category": "Truck", "price": 44900, "quantity": 3},
    {"make": "Volkswagen", "model": "Golf GTI", "category": "Hatchback", "price": 31200, "quantity": 5},
    {"make": "Mazda", "model": "MX-5 Miata", "category": "Convertible", "price": 29800, "quantity": 2},
    {"make": "Tesla", "model": "Model 3", "category": "Electric", "price": 40200, "quantity": 7},
    {"make": "Hyundai", "model": "Ioniq 5", "category": "Electric", "price": 43500, "quantity": 1},
    {"make": "BMW", "model": "M240i", "category": "Coupe", "price": 51900, "quantity": 2},
]


class SeedConfigError(Exception):
    """Raised when ADMIN_EMAIL / ADMIN_PASSWORD are not configured."""


def _seed_admin(session: Session, settings: Settings) -> None:
    users = UserRepository(session)
    email = normalise_email(settings.admin_email)
    existing = users.get_by_email(email)
    if existing is None:
        users.add(email, hash_password(settings.admin_password), Role.ADMIN)
    elif existing.role != Role.ADMIN.value:
        users.set_role(existing, Role.ADMIN)


def _seed_vehicles(session: Session) -> None:
    vehicles = VehicleRepository(session)
    if vehicles.list_all():
        return
    for fields in DEMO_VEHICLES:
        vehicles.add(**fields)


def run_seed(settings: Settings | None = None) -> None:
    """Create tables, the admin account and demo vehicles. Safe to run repeatedly."""
    settings = settings or get_settings()
    if not settings.admin_email or not settings.admin_password:
        raise SeedConfigError("ADMIN_EMAIL and ADMIN_PASSWORD must be set")
    init_db()
    with get_session_factory()() as session:
        _seed_admin(session, settings)
        _seed_vehicles(session)


if __name__ == "__main__":
    run_seed()
    print("Seed complete.")
