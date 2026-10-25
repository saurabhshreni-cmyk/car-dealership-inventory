"""Shared pytest fixtures: env defaults, real test database, API client.

Tests run against a real database through the same engine the app uses:
a throw-away SQLite *file*, or Postgres when TEST_DATABASE_URL is set.
"""
import os
import tempfile
from pathlib import Path

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters-long")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
_TEST_DB_DIR = tempfile.mkdtemp(prefix="dealership-tests-")
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or (
    f"sqlite:///{(Path(_TEST_DB_DIR) / 'test.db').as_posix()}"
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(autouse=True)
def clean_database():
    """Recreate all tables so every test starts from an empty database."""
    from app.database import Base, get_engine
    import app.models  # noqa: F401  (register tables)

    engine = get_engine()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client() -> TestClient:
    """HTTP client bound to the real application."""
    from app.main import create_app

    return TestClient(create_app())


@pytest.fixture
def session():
    """A SQLAlchemy session on the test database."""
    from app.database import get_session_factory

    with get_session_factory()() as db:
        yield db


@pytest.fixture
def create_user(session):
    """Factory inserting a user with the given role directly via the repository."""
    from app.models.user import Role
    from app.repositories.user_repository import UserRepository
    from app.services.security import hash_password

    def _create(email: str = "someone@example.com", role: str = "user", password: str = "correct-horse"):
        return UserRepository(session).add(email, hash_password(password), Role(role))

    return _create


@pytest.fixture
def auth_headers(create_user):
    """Factory returning Authorization headers for a freshly created user."""
    from app.services.security import create_access_token

    def _headers(role: str = "user", email: str | None = None) -> dict[str, str]:
        user = create_user(email or f"{role}@example.com", role)
        return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}

    return _headers
