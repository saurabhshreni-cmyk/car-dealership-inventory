"""Registration business logic."""
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.security import hash_password


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already exists."""


def normalise_email(email: str) -> str:
    """Lower-case and trim an email address."""
    return email.strip().lower()


class AuthService:
    """Registers accounts. Registration always creates a normal user."""

    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def register(self, email: str, password: str) -> User:
        """Create a normal user or raise EmailAlreadyRegisteredError."""
        email = normalise_email(email)
        if self._users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        return self._users.add(email, hash_password(password))
