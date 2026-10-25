"""Shared FastAPI dependencies."""
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Provide a UserRepository bound to the request session."""
    return UserRepository(db)


def get_auth_service(users: UserRepository = Depends(get_user_repository)) -> AuthService:
    """Provide an AuthService."""
    return AuthService(users)
