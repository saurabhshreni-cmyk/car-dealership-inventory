"""Vehicle routes (thin: validate, authorise, delegate to the service)."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.models.user import User
from app.routes.deps import get_current_user, get_inventory_service, get_vehicle_service, require_admin
from app.schemas.purchase import PurchaseOut
from app.schemas.vehicle import RestockRequest, VehicleCreate, VehicleOut, VehicleSearchParams
from app.services.inventory_service import InventoryService, OutOfStockError
from app.services.vehicle_service import VehicleNotFoundError, VehicleService

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


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleCreate,
    _admin: User = Depends(require_admin),
    service: VehicleService = Depends(get_vehicle_service),
):
    """Replace a vehicle's details (admin only)."""
    try:
        return service.update(vehicle_id, payload)
    except VehicleNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    _admin: User = Depends(require_admin),
    service: VehicleService = Depends(get_vehicle_service),
):
    """Delete a vehicle (admin only)."""
    try:
        service.delete(vehicle_id)
    except VehicleNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/purchase", response_model=PurchaseOut, status_code=status.HTTP_201_CREATED)
def purchase_vehicle(
    vehicle_id: int,
    user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service),
):
    """Buy one unit of a vehicle; 409 when it is out of stock."""
    try:
        return service.purchase(vehicle_id, user.id)
    except VehicleNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
    except OutOfStockError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Vehicle is out of stock")


@router.post("/{vehicle_id}/restock", response_model=VehicleOut)
def restock_vehicle(
    vehicle_id: int,
    payload: RestockRequest,
    _admin: User = Depends(require_admin),
    service: InventoryService = Depends(get_inventory_service),
):
    """Add stock to a vehicle (admin only)."""
    try:
        return service.restock(vehicle_id, payload.amount)
    except VehicleNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vehicle not found")
