"""Shared FastAPI dependencies."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import Role, User
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.auth_service import AuthService
from app.services.inventory_service import InventoryService
from app.services.security import InvalidTokenError, decode_access_token
from app.services.vehicle_service import VehicleService

bearer_scheme = HTTPBearer(auto_error=False)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    """Provide a UserRepository bound to the request session."""
    return UserRepository(db)


def get_auth_service(users: UserRepository = Depends(get_user_repository)) -> AuthService:
    """Provide an AuthService."""
    return AuthService(users)


def get_vehicle_repository(db: Session = Depends(get_db)) -> VehicleRepository:
    """Provide a VehicleRepository bound to the request session."""
    return VehicleRepository(db)


def get_vehicle_service(vehicles: VehicleRepository = Depends(get_vehicle_repository)) -> VehicleService:
    """Provide a VehicleService."""
    return VehicleService(vehicles)


def get_purchase_repository(db: Session = Depends(get_db)) -> PurchaseRepository:
    """Provide a PurchaseRepository bound to the request session."""
    return PurchaseRepository(db)


def get_inventory_service(
    vehicles: VehicleRepository = Depends(get_vehicle_repository),
    purchases: PurchaseRepository = Depends(get_purchase_repository),
) -> InventoryService:
    """Provide an InventoryService."""
    return InventoryService(vehicles, purchases)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"})


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    users: UserRepository = Depends(get_user_repository),
) -> User:
    """Resolve the authenticated user from the Bearer token or raise 401."""
    if credentials is None:
        raise _unauthorized("Not authenticated")
    try:
        user_id = int(decode_access_token(credentials.credentials))
    except (InvalidTokenError, ValueError):
        raise _unauthorized("Invalid or expired token")
    user = users.get_by_id(user_id)
    if user is None:
        raise _unauthorized("Invalid or expired token")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Allow only admin accounts, otherwise 403."""
    if user.role != Role.ADMIN.value:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin privileges required")
    return user
