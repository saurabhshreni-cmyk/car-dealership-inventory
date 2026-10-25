"""Persistence for users."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import Role, User


class UserRepository:
    """All database access for the users table."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, user_id: int) -> User | None:
        """Return the user with this id, or None."""
        return self._session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Return the user with this (already normalised) email, or None."""
        return self._session.scalar(select(User).where(User.email == email))

    def add(self, email: str, password_hash: str, role: Role = Role.USER) -> User:
        """Insert and return a new user."""
        user = User(email=email, password_hash=password_hash, role=role.value)
        self._session.add(user)
        self._session.commit()
        return user

    def set_role(self, user: User, role: Role) -> User:
        """Change a user's role and persist."""
        user.role = role.value
        self._session.commit()
        return user
