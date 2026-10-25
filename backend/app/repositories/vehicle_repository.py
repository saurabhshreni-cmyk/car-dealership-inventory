"""Persistence for vehicles."""
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleSearchParams


_LIKE_ESCAPES = str.maketrans({"\\": "\\\\", "%": "\\%", "_": "\\_"})


def _contains(column, term: str):
    """Case-insensitive substring match where %, _ and backslash in ``term`` are literal."""
    return func.lower(column).like(f"%{term.lower().translate(_LIKE_ESCAPES)}%", escape="\\")


class VehicleRepository:
    """All database access for the vehicles table."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, **fields) -> Vehicle:
        """Insert and return a new vehicle."""
        vehicle = Vehicle(**fields)
        self._session.add(vehicle)
        self._session.commit()
        return vehicle

    def list_all(self) -> list[Vehicle]:
        """Return every vehicle ordered by id."""
        return list(self._session.scalars(select(Vehicle).order_by(Vehicle.id)))

    def search(self, params: VehicleSearchParams) -> list[Vehicle]:
        """Return vehicles matching all supplied filters, ordered by id."""
        stmt = select(Vehicle)
        if params.make:
            stmt = stmt.where(_contains(Vehicle.make, params.make))
        if params.model:
            stmt = stmt.where(_contains(Vehicle.model, params.model))
        if params.category:
            stmt = stmt.where(func.lower(Vehicle.category) == params.category.strip().lower())
        if params.min_price is not None:
            stmt = stmt.where(Vehicle.price >= params.min_price)
        if params.max_price is not None:
            stmt = stmt.where(Vehicle.price <= params.max_price)
        return list(self._session.scalars(stmt.order_by(Vehicle.id)))

    def get(self, vehicle_id: int) -> Vehicle | None:
        """Return the vehicle with this id, or None."""
        return self._session.get(Vehicle, vehicle_id)

    def update(self, vehicle: Vehicle, **fields) -> Vehicle:
        """Apply ``fields`` to ``vehicle`` and persist."""
        for name, value in fields.items():
            setattr(vehicle, name, value)
        self._session.commit()
        return vehicle

    def delete(self, vehicle: Vehicle) -> None:
        """Remove a vehicle."""
        self._session.delete(vehicle)
        self._session.commit()

    def add_stock(self, vehicle_id: int, amount: int) -> Vehicle | None:
        """Atomically add ``amount`` units; return the vehicle, or None if it does not exist."""
        vehicle = self._session.scalars(
            update(Vehicle)
            .where(Vehicle.id == vehicle_id)
            .values(quantity=Vehicle.quantity + amount)
            .returning(Vehicle)
            .execution_options(populate_existing=True)
        ).first()
        self._session.commit()
        return vehicle
