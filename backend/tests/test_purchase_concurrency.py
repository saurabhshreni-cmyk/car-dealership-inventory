"""Purchases must be atomic: concurrent buyers can never oversell stock."""
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import func, select

from app.database import get_session_factory
from app.models.purchase import Purchase
from app.models.vehicle import Vehicle
from app.repositories.purchase_repository import PurchaseRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.services.inventory_service import InventoryService, OutOfStockError

STOCK = 5
BUYERS = 25


def test_concurrent_purchases_never_oversell(stock, create_user):
    vehicle = stock(quantity=STOCK)
    buyer_ids = [create_user(f"buyer{i}@example.com").id for i in range(BUYERS)]

    def buy(user_id: int) -> bool:
        with get_session_factory()() as db:
            service = InventoryService(VehicleRepository(db), PurchaseRepository(db))
            try:
                service.purchase(vehicle.id, user_id)
            except OutOfStockError:
                return False
            return True

    with ThreadPoolExecutor(max_workers=BUYERS) as pool:
        outcomes = list(pool.map(buy, buyer_ids))

    with get_session_factory()() as db:
        remaining = db.scalar(select(Vehicle.quantity).where(Vehicle.id == vehicle.id))
        recorded = db.scalar(select(func.count()).select_from(Purchase))
    assert outcomes.count(True) == STOCK
    assert outcomes.count(False) == BUYERS - STOCK
    assert remaining == 0
    assert recorded == STOCK
