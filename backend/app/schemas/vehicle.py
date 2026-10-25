"""Request/response schemas for vehicles."""
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, StringConstraints

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Price = Annotated[
    Decimal,
    Field(gt=0, max_digits=12, decimal_places=2),
    PlainSerializer(float, return_type=float, when_used="json"),
]


class VehicleCreate(BaseModel):
    """Payload to create a vehicle."""

    make: Text
    model: Text
    category: Text
    price: Price
    quantity: int = Field(ge=0)


class VehicleOut(BaseModel):
    """Vehicle representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
    quantity: int
