"""Schemas for purchases."""
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer


class PurchaseOut(BaseModel):
    """A purchase as returned by the API."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    vehicle_id: int | None
    make: str = Field(validation_alias="vehicle_make")
    model: str = Field(validation_alias="vehicle_model")
    price: Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
    purchased_at: datetime
