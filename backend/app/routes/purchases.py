"""Purchase history routes."""
from fastapi import APIRouter, Depends

from app.models.user import User
from app.routes.deps import get_current_user, get_inventory_service
from app.schemas.purchase import PurchaseOut
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


@router.get("/me", response_model=list[PurchaseOut])
def my_purchases(
    user: User = Depends(get_current_user),
    service: InventoryService = Depends(get_inventory_service),
):
    """Return the authenticated user's purchases, newest first."""
    return service.purchases_for(user.id)
