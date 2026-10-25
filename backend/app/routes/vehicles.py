"""Vehicle routes (thin: validate, authorise, delegate to the service)."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.models.user import User
from app.routes.deps import get_current_user, get_vehicle_service, require_admin
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleSearchParams
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


@router.get("", response_model=list[VehicleOut])
def list_vehicles(service: VehicleService = Depends(get_vehicle_service)):
    """List all vehicles."""
    return service.list_all()


@router.get("/search", response_model=list[VehicleOut])
def search_vehicles(
    params: Annotated[VehicleSearchParams, Query()],
    service: VehicleService = Depends(get_vehicle_service),
):
    """Search by make, model, category and price range (must stay above /{id} routes)."""
    return service.search(params)
