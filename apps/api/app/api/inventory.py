from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Inventory, ProductVariant, StockMovement
from app.services.store import get_or_create_user
from app.services.inventory_lifecycle import release_expired_reservations

router = APIRouter(prefix="/inventory", tags=["inventory"])


class InventoryUpdate(BaseModel):
    available: int = Field(ge=0)
    reserved: int = Field(default=0, ge=0)
    reason: str = Field(default="admin_adjustment", max_length=180)


def serialize_inventory(row: Inventory) -> dict:
    variant = row.variant if hasattr(row, "variant") else None
    product = variant.product if variant else None
    return {
        "id": row.id,
        "variant_id": row.variant_id,
        "product": product.name if product else None,
        "slug": product.slug if product else None,
        "weight_kg": variant.weight_kg if variant else None,
        "available": row.available,
        "reserved": row.reserved
    }


@router.get("")
def list_inventory(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(Inventory).order_by(Inventory.id.asc()).offset(skip).limit(min(limit, 200)).all()
    return [serialize_inventory(row) for row in rows]


@router.patch("/{variant_id}")
def update_inventory(variant_id: int, payload: InventoryUpdate, admin: dict = Depends(require_admin_permission("inventory.adjust")), db: Session = Depends(get_db)):
    variant = db.query(ProductVariant).filter_by(id=variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    row = db.query(Inventory).filter_by(variant_id=variant_id).first()
    if not row:
        row = Inventory(variant_id=variant_id)
        db.add(row)
    row.available = payload.available
    row.reserved = payload.reserved
    variant.inventory = payload.available
    db.add(StockMovement(variant_id=variant_id, quantity=payload.available, movement_type="adjustment", reason=payload.reason))
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="inventory_adjust", entity=f"variant:{variant_id}", metadata_json=f'{{"available":{payload.available},"reserved":{payload.reserved}}}'))
    db.commit()
    db.refresh(row)
    return serialize_inventory(row)


@router.post("/reservations/release-expired")
def release_expired(admin: dict = Depends(require_admin_permission("inventory.adjust")), db: Session = Depends(get_db)):
    return {"released": release_expired_reservations(db)}
