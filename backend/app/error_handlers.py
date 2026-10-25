"""Maps domain exceptions to HTTP responses so routes stay thin."""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.services.auth_service import EmailAlreadyRegisteredError, InvalidCredentialsError
from app.services.inventory_service import OutOfStockError
from app.services.vehicle_service import VehicleNotFoundError

_MAPPINGS: list[tuple[type[Exception], int, str, dict[str, str]]] = [
    (VehicleNotFoundError, 404, "Vehicle not found", {}),
    (OutOfStockError, 409, "Vehicle is out of stock", {}),
    (EmailAlreadyRegisteredError, 409, "Email already registered", {}),
    (InvalidCredentialsError, 401, "Invalid email or password", {"WWW-Authenticate": "Bearer"}),
]


def register_error_handlers(app: FastAPI) -> None:
    """Install one handler per domain exception."""
    for exc_type, status_code, detail, headers in _MAPPINGS:

        def handler(_request: Request, _exc: Exception, _s=status_code, _d=detail, _h=headers):
            return JSONResponse({"detail": _d}, status_code=_s, headers=_h)

        app.add_exception_handler(exc_type, handler)
