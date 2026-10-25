"""Authentication routes (thin: validate, delegate to the service, map errors)."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.deps import get_auth_service
from app.schemas.auth import RegisterRequest, UserOut
from app.services.auth_service import AuthService, EmailAlreadyRegisteredError

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    """Register a normal user account."""
    try:
        return service.register(payload.email, payload.password)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
