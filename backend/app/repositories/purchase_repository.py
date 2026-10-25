"""Persistence for purchases, including the atomic stock decrement."""
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.models.vehicle import Vehicle


class PurchaseRepository:
    """All database access for the purchases table."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def purchase_one(self, vehicle_id: int, user_id: int) -> Purchase | None:
        """Atomically buy one unit; return the Purchase, or None if no stock / no such vehicle.

        A single conditional ``UPDATE ... WHERE quantity > 0`` takes the unit, so two buyers can
        never both win the last one. The purchase row is written in the same transaction.
        """
        claimed = self._session.execute(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id, Vehicle.quantity > 0)
            .values(quantity=Vehicle.quantity - 1)
            .returning(Vehicle.make, Vehicle.model, Vehicle.price)
        ).first()
        if claimed is None:
            self._session.rollback()
            return None
        purchase = Purchase(
            user_id=user_id,
            vehicle_id=vehicle_id,
            vehicle_make=claimed.make,
            vehicle_model=claimed.model,
            price=claimed.price,
        )
        self._session.add(purchase)
        self._session.commit()
        return purchase

    def list_for_user(self, user_id: int) -> list[Purchase]:
        """Return a user's purchases, newest first."""
        stmt = select(Purchase).where(Purchase.user_id == user_id).order_by(Purchase.id.desc())
        return list(self._session.scalars(stmt))
