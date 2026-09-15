from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin_permission
from app.core.database import get_db
from app.models.entities import DeliveryRule
from app.services.business_rules import delivery_charge

router = APIRouter(prefix="/delivery", tags=["delivery"])

PINCODE_DISTANCE = {
    "201301": 8,
    "201304": 18,
    "201305": 28,
    "201009": 34,
    "201318": 45
}


class DeliveryCheck(BaseModel):
    distance_km: float | None = None
    pincode: str | None = Field(default=None, min_length=6, max_length=6)
    address: str | None = None
    admin_override: bool = False


class DeliveryRuleIn(BaseModel):
    min_km: float = Field(ge=0)
    max_km: float | None = None
    charge: float | None = None
    deliverable: bool = True
    admin_override_allowed: bool = False


def serialize_rule(row: DeliveryRule) -> dict:
    return {
        "id": row.id,
        "min_km": row.min_km,
        "max_km": row.max_km,
        "charge": float(row.charge) if row.charge is not None else None,
        "deliverable": row.deliverable,
        "admin_override_allowed": row.admin_override_allowed,
        "eta": eta_for(float(row.max_km or row.min_km), row.deliverable)
    }


def eta_for(distance: float, deliverable: bool) -> str:
    if not deliverable:
        return "Not currently serviceable"
    if distance <= 20:
        return "Same-day fresh delivery"
    if distance <= 40:
        return "Next route delivery"
    return "Scheduled delivery"


@router.post("/check")
def check_delivery(payload: DeliveryCheck):
    distance = payload.distance_km
    if distance is None and payload.pincode:
        distance = PINCODE_DISTANCE.get(payload.pincode)
    if distance is None:
        distance = 18 if payload.address else 999
    result = delivery_charge(float(distance), payload.admin_override)
    return {
        **result,
        "distance_km": float(distance),
        "eta": eta_for(float(distance), result["deliverable"]),
        "pincode": payload.pincode
    }


@router.get("/rules")
def rules(db: Session = Depends(get_db)):
    rows = db.query(DeliveryRule).order_by(DeliveryRule.min_km.asc()).all()
    return [serialize_rule(row) for row in rows]


@router.post("/rules")
def create_rule(payload: DeliveryRuleIn, admin: dict = Depends(require_admin_permission("delivery:write")), db: Session = Depends(get_db)):
    row = DeliveryRule(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize_rule(row)


@router.patch("/rules/{rule_id}")
def update_rule(rule_id: int, payload: DeliveryRuleIn, admin: dict = Depends(require_admin_permission("delivery:write")), db: Session = Depends(get_db)):
    row = db.query(DeliveryRule).filter_by(id=rule_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Delivery rule not found")
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return serialize_rule(row)
