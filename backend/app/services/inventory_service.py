"""Inventory operations: purchasing and restocking."""
from app.models.purchase import Purchase
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.vehicle_service import VehicleNotFoundError


class OutOfStockError(Exception):
    """Raised when a purchase is attempted on a vehicle with no stock."""


class InventoryService:
    """Coordinates stock changes and purchase records."""

    def __init__(self, vehicles: VehicleRepository, purchases: PurchaseRepository) -> None:
        self._vehicles = vehicles
        self._purchases = purchases

    def purchase(self, vehicle_id: int, user_id: int) -> Purchase:
        """Buy one unit atomically.

        Raises VehicleNotFoundError for unknown ids and OutOfStockError when quantity is 0.
        """
        purchase = self._purchases.purchase_one(vehicle_id, user_id)
        if purchase is not None:
            return purchase
        if self._vehicles.get(vehicle_id) is None:
            raise VehicleNotFoundError(vehicle_id)
        raise OutOfStockError(vehicle_id)
