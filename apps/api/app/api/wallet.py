from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Setting, WalletTransaction
from app.services.store import get_or_create_user, wallet_balance

router = APIRouter(prefix="/wallet", tags=["wallet"])


class RedeemIn(BaseModel):
    amount: int = Field(ge=1)


class WalletAdjustmentIn(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    amount: int
    reason: str = Field(min_length=3, max_length=160)


class WalletToggle(BaseModel):
    enabled: bool


class RechargeIn(BaseModel):
    amount: int = Field(ge=50, le=50000)


def wallet_enabled(db: Session) -> bool:
    setting = db.query(Setting).filter_by(key="wallet_active").first()
    return setting.value.lower() == "true" if setting else True


@router.get("")
def ledger(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(WalletTransaction).filter_by(user_id=record.id).order_by(WalletTransaction.created_at.desc()).all()
    return {
        "enabled": wallet_enabled(db) and record.wallet_active,
        "balance": wallet_balance(db, record.id),
        "transactions": [
            {
                "id": row.id,
                "amount": float(row.amount),
                "transaction_type": row.transaction_type,
                "reason": row.reason,
                "order_id": row.order_id,
                "created_at": row.created_at.isoformat()
            }
            for row in rows
        ]
    }


@router.post("/redeem")
def redeem(payload: RedeemIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    balance = wallet_balance(db, record.id)
    if payload.amount > balance:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    db.add(WalletTransaction(user_id=record.id, amount=-payload.amount, transaction_type="debit", reason="redeemed"))
    db.commit()
    return ledger(user, db)


@router.post("/recharge")
def recharge(payload: RechargeIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    db.add(WalletTransaction(user_id=record.id, amount=payload.amount, transaction_type="credit", reason="wallet_recharge"))
    db.commit()
    return ledger(user, db)


@router.post("/admin/adjust")
def admin_adjust(payload: WalletAdjustmentIn, admin: dict = Depends(require_admin_permission("wallet.adjust")), db: Session = Depends(get_db)):
    record = get_or_create_user(db, payload.phone, "customer")
    transaction_type = "admin_adjustment"
    db.add(WalletTransaction(user_id=record.id, amount=payload.amount, transaction_type=transaction_type, reason=payload.reason))
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="wallet_adjust", entity=f"user:{record.id}", metadata_json=f'{{"amount":{payload.amount}}}'))
    db.commit()
    return ledger({"sub": record.phone, "role": record.role}, db)


@router.patch("/settings")
def toggle_wallet(payload: WalletToggle, admin: dict = Depends(require_admin_permission("wallet.adjust")), db: Session = Depends(get_db)):
    setting = db.query(Setting).filter_by(key="wallet_active").first()
    if not setting:
        setting = Setting(key="wallet_active", value=str(payload.enabled).lower())
        db.add(setting)
    else:
        setting.value = str(payload.enabled).lower()
    db.commit()
    return {"enabled": payload.enabled}
