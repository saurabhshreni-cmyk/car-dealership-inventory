"""Vehicle catalogue business logic."""
from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate, VehicleSearchParams


class VehicleNotFoundError(Exception):
    """Raised when a vehicle id does not exist."""


class VehicleService:
    """Creates, lists, searches, updates and deletes vehicles."""

    def __init__(self, vehicles: VehicleRepository) -> None:
        self._vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        """Create a vehicle from validated input."""
        return self._vehicles.add(**data.model_dump())

    def list_all(self) -> list[Vehicle]:
        """Return all vehicles."""
        return self._vehicles.list_all()

    def search(self, params: VehicleSearchParams) -> list[Vehicle]:
        """Return vehicles matching the filters."""
        return self._vehicles.search(params)

    def _get_or_raise(self, vehicle_id: int) -> Vehicle:
        vehicle = self._vehicles.get(vehicle_id)
        if vehicle is None:
            raise VehicleNotFoundError(vehicle_id)
        return vehicle

    def update(self, vehicle_id: int, data: VehicleCreate) -> Vehicle:
        """Replace a vehicle's fields or raise VehicleNotFoundError."""
        return self._vehicles.update(self._get_or_raise(vehicle_id), **data.model_dump())

    def delete(self, vehicle_id: int) -> None:
        """Delete a vehicle or raise VehicleNotFoundError."""
        self._vehicles.delete(self._get_or_raise(vehicle_id))
