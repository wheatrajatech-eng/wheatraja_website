from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin, require_admin_permission
from app.core.database import get_db
from app.models.entities import Coupon

router = APIRouter(prefix="/coupons", tags=["coupons"])


class CouponApply(BaseModel):
    code: str
    subtotal: float


class CouponIn(BaseModel):
    code: str = Field(min_length=2, max_length=40)
    percent_off: int = Field(ge=1, le=90)
    active: bool = True


@router.post("/apply")
def apply(payload: CouponApply, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter_by(code=payload.code.strip().upper(), active=True).first()
    if not coupon:
        return {"valid": False, "discount": 0}
    return {"valid": True, "discount": round(payload.subtotal * (coupon.percent_off / 100), 2), "percent_off": coupon.percent_off}


@router.get("")
def list_coupons(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": row.id, "code": row.code, "percent_off": row.percent_off, "active": row.active} for row in db.query(Coupon).order_by(Coupon.created_at.desc()).all()]


@router.post("")
def upsert_coupon(payload: CouponIn, admin: dict = Depends(require_admin_permission("coupons:write")), db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter_by(code=payload.code.upper()).first()
    if not coupon:
        coupon = Coupon(code=payload.code.upper(), percent_off=payload.percent_off, active=payload.active)
        db.add(coupon)
    else:
        coupon.percent_off = payload.percent_off
        coupon.active = payload.active
    db.commit()
    db.refresh(coupon)
    return {"id": coupon.id, "code": coupon.code, "percent_off": coupon.percent_off, "active": coupon.active}


@router.patch("/{coupon_id}")
def update_coupon(coupon_id: int, payload: CouponIn, admin: dict = Depends(require_admin_permission("coupons:write")), db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter_by(id=coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon.code = payload.code.upper()
    coupon.percent_off = payload.percent_off
    coupon.active = payload.active
    db.commit()
    db.refresh(coupon)
    return {"id": coupon.id, "code": coupon.code, "percent_off": coupon.percent_off, "active": coupon.active}
