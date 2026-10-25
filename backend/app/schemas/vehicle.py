"""Request/response schemas for vehicles."""
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, StrictInt, ConfigDict, Field, PlainSerializer, StringConstraints, model_validator

MAX_QUANTITY = 1_000_000  # keeps stock arithmetic far inside a 32-bit INTEGER column
INT32_MAX = 2_147_483_647

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
    quantity: int = Field(ge=0, le=MAX_QUANTITY)


class VehicleOut(BaseModel):
    """Vehicle representation returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    make: str
    model: str
    category: str
    price: Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
    quantity: int


class VehicleSearchParams(BaseModel):
    """Optional filters for GET /api/vehicles/search."""

    make: str | None = None
    model: str | None = None
    category: str | None = None
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _check_price_range(self) -> "VehicleSearchParams":
        if self.min_price is not None and self.max_price is not None and self.min_price > self.max_price:
            raise ValueError("min_price must not exceed max_price")
        return self


class RestockRequest(BaseModel):
    """Payload to add stock to a vehicle."""

    amount: StrictInt = Field(gt=0, le=MAX_QUANTITY)
