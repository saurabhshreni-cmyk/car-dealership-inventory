"""Vehicle catalogue business logic."""
from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.vehicle import VehicleCreate


class VehicleService:
    """Creates, lists, searches, updates and deletes vehicles."""

    def __init__(self, vehicles: VehicleRepository) -> None:
        self._vehicles = vehicles

    def create(self, data: VehicleCreate) -> Vehicle:
        """Create a vehicle from validated input."""
        return self._vehicles.add(**data.model_dump())
