from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import Referral, User, WalletTransaction
from app.services.store import get_or_create_user
from app.services.referrals import apply_referral_code_to_user

router = APIRouter(prefix="/referrals", tags=["referrals"])


class ReferralApply(BaseModel):
    code: str = Field(min_length=4, max_length=4)


@router.get("")
def my_referral(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    referrals = db.query(Referral).filter_by(referrer_id=record.id).all()
    return {
        "code": record.referral_code,
        "referrals": [{"id": row.id, "referred_user_id": row.referred_user_id, "rewarded": row.rewarded} for row in referrals]
    }


@router.post("/apply")
def apply_referral(payload: ReferralApply, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    referral = apply_referral_code_to_user(db, record, payload.code)
    db.commit()
    referrer = db.query(User).filter_by(id=referral.referrer_id).first()
    return {"applied": True, "referrer_code": referrer.referral_code if referrer else payload.code.upper()}


@router.post("/{referral_id}/reward")
def reward_referral(referral_id: int, admin: dict = Depends(require_admin_permission("referrals.write")), db: Session = Depends(get_db)):
    referral = db.query(Referral).filter_by(id=referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if referral.rewarded:
        return {"rewarded": True, "duplicate": True}
    referral.rewarded = True
    db.add(WalletTransaction(user_id=referral.referrer_id, amount=100, transaction_type="credit", reason="referral_reward"))
    db.add(WalletTransaction(user_id=referral.referred_user_id, amount=100, transaction_type="credit", reason="referral_reward"))
    db.commit()
    return {"rewarded": True, "points": 100}
