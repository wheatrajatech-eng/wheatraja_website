from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Order, Referral, User, WalletTransaction


def apply_referral_code_to_user(db: Session, user: User, code: str) -> Referral:
    normalized = code.strip().upper()
    if len(normalized) != 4 or not normalized.isascii() or not normalized.isalpha() or len(set(normalized)) != 4:
        raise HTTPException(status_code=400, detail="Referral code must contain 4 different letters")
    referrer = db.query(User).filter_by(referral_code=normalized).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Referral code not found")
    if referrer.id == user.id:
        raise HTTPException(status_code=400, detail="Self referral is not allowed")
    existing = db.query(Referral).filter_by(referred_user_id=user.id).first()
    if existing:
        if existing.referrer_id == referrer.id:
            return existing
        raise HTTPException(status_code=400, detail="Referral already applied")
    if db.query(Order).filter_by(user_id=user.id).first():
        raise HTTPException(status_code=400, detail="Referral must be applied before your first order")
    referral = Referral(referrer_id=referrer.id, referred_user_id=user.id, rewarded=False)
    db.add(referral)
    db.flush()
    return referral


def reward_first_paid_order_referral(db: Session, order: Order) -> bool:
    if order.payment_status not in {"paid", "demo_paid"}:
        return False
    referral = db.query(Referral).filter_by(referred_user_id=order.user_id, rewarded=False).first()
    if not referral:
        return False
    prior_paid_orders = (
        db.query(Order)
        .filter(
            Order.user_id == order.user_id,
            Order.id != order.id,
            Order.payment_status.in_(["paid", "demo_paid"]),
        )
        .count()
    )
    if prior_paid_orders > 0:
        return False

    referral.rewarded = True
    db.add(
        WalletTransaction(
            user_id=referral.referrer_id,
            order_id=order.id,
            amount=100,
            transaction_type="credit",
            reason="referral_reward_first_order",
        )
    )
    db.add(
        WalletTransaction(
            user_id=referral.referred_user_id,
            order_id=order.id,
            amount=100,
            transaction_type="credit",
            reason="referral_reward_first_order",
        )
    )
    return True
