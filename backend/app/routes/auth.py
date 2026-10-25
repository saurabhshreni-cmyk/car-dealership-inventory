"""Authentication routes (thin: validate, delegate to the service, map errors)."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.deps import get_auth_service
from app.schemas.auth import LoginRequest, RegisterRequest, TokenOut, UserOut
from app.services.auth_service import AuthService, EmailAlreadyRegisteredError, InvalidCredentialsError

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    """Register a normal user account."""
    try:
        return service.register(payload.email, payload.password)
    except EmailAlreadyRegisteredError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")


@router.post("/login", response_model=TokenOut)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    """Exchange email + password for a JWT."""
    try:
        token, user = service.login(payload.email, payload.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenOut(access_token=token, user=UserOut.model_validate(user))
