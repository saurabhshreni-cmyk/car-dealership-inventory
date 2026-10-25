"""Persistence for vehicles."""
from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle


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
