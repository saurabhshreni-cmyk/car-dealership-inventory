"""Registration and login business logic."""
from functools import lru_cache

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.security import create_access_token, hash_password, verify_password


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already exists."""


def normalise_email(email: str) -> str:
    """Lower-case and trim an email address."""
    return email.strip().lower()


@lru_cache
def _decoy_hash() -> str:
    """A throw-away bcrypt hash verified against when the email is unknown (constant-work login)."""
    return hash_password("decoy-password-never-matches")


class InvalidCredentialsError(Exception):
    """Raised when email/password do not match an account."""


class AuthService:
    """Registers accounts (always normal users) and authenticates logins."""

    def __init__(self, users: UserRepository) -> None:
        self._users = users

    def register(self, email: str, password: str) -> User:
        """Create a normal user or raise EmailAlreadyRegisteredError."""
        email = normalise_email(email)
        if self._users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        return self._users.add(email, hash_password(password))

    def login(self, email: str, password: str) -> tuple[str, User]:
        """Return (access_token, user) or raise InvalidCredentialsError."""
        user = self._users.get_by_email(normalise_email(email))
        password_hash = user.password_hash if user is not None else _decoy_hash()
        password_ok = verify_password(password, password_hash)
        if user is None or not password_ok:
            raise InvalidCredentialsError()
        return create_access_token(str(user.id)), user
