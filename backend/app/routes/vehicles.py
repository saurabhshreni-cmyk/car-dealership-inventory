"""Vehicle routes (thin: validate, authorise, delegate to the service)."""
from fastapi import APIRouter, Depends, status

from app.models.user import User
from app.routes.deps import get_current_user, get_vehicle_service, require_admin
from app.schemas.vehicle import VehicleCreate, VehicleOut
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    _admin: User = Depends(require_admin),
    service: VehicleService = Depends(get_vehicle_service),
):
    """Add a vehicle (admin only)."""
    return service.create(payload)
