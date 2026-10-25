"""Password hashing and JWT helpers."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import Settings, get_settings


class InvalidTokenError(Exception):
    """Raised when a JWT is malformed, tampered with, or expired."""


def hash_password(password: str) -> str:
    """Return a salted bcrypt hash of ``password``."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Check ``password`` against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    subject: str,
    *,
    expires_delta: timedelta | None = None,
    settings: Settings | None = None,
) -> str:
    """Create a signed JWT whose ``sub`` claim is ``subject``."""
    settings = settings or get_settings()
    lifetime = expires_delta if expires_delta is not None else timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": datetime.now(timezone.utc) + lifetime}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, *, settings: Settings | None = None) -> str:
    """Return the ``sub`` claim of a valid token or raise InvalidTokenError."""
    settings = settings or get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
    subject = payload.get("sub")
    if not subject:
        raise InvalidTokenError("token has no subject")
    return str(subject)
