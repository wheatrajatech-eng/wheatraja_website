import json
from datetime import datetime
from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Cart, CartItem, Order, Payment, PaymentWebhook, Refund, WalletTransaction
from app.services.business_rules import wallet_points
from app.services.inventory_lifecycle import commit_order_inventory, release_order_inventory
from app.services.notifications import create_notification
from app.services.referrals import reward_first_paid_order_referral
from app.services.reminders import schedule_order_reorder_reminder
from app.services.refunds import create_provider_refund
from app.services.razorpay_provider import RazorpayProvider, dumps_provider_payload
from app.services.store import get_or_create_user, money

router = APIRouter(prefix="/payments", tags=["payments"])
razorpay_provider = RazorpayProvider()


class RazorpayOrderIn(BaseModel):
    order_id: str


class PaymentVerifyIn(BaseModel):
    order_id: str
    razorpay_order_id: str = Field(min_length=3)
    razorpay_payment_id: str = Field(min_length=3)
    razorpay_signature: str = Field(min_length=3)
    demo: bool = False


class PaymentFailureIn(BaseModel):
    order_id: str
    reason: str = Field(default="payment_failed", max_length=240)


class RefundIn(BaseModel):
    amount: float = Field(gt=0)
    reason: str = Field(min_length=3, max_length=240)


class ManualPaymentIn(BaseModel):
    method: str = Field(pattern="^(cod|cash|upi|bank_transfer|pos_card|wallet_adjustment|other)$")
    status: str = Field(pattern="^(pending|partial|paid)$")
    amount_received: float = Field(default=0, ge=0)
    transaction_reference: str | None = Field(default=None, max_length=160)
    payment_date: datetime | None = None
    note: str | None = Field(default=None, max_length=500)
    proof_url: str | None = Field(default=None, max_length=500)


def mark_paid(db: Session, order: Order, provider_payment_id: str | None = None, signature: str | None = None, demo: bool = False) -> Order:
    if order.payment_status in {"paid", "demo_paid"}:
        return order
    order.payment_status = "demo_paid" if demo else "paid"
    order.status = "placed"
    payment = db.query(Payment).filter_by(order_id=order.id).first()
    if not payment:
        payment = Payment(order_id=order.id, provider="razorpay", amount=order.total, status=order.payment_status)
        db.add(payment)
    payment.provider_payment_id = provider_payment_id
    payment.provider_signature = signature
    payment.status = order.payment_status
    commit_order_inventory(db, order)
    existing = db.query(WalletTransaction).filter_by(user_id=order.user_id, order_id=order.id, reason="order_earned").first()
    if not existing:
        db.add(WalletTransaction(user_id=order.user_id, order_id=order.id, amount=wallet_points(money(order.total)), transaction_type="credit", reason="order_earned"))
    cart = db.query(Cart).filter_by(user_id=order.user_id).first()
    if cart:
        for item in db.query(CartItem).filter_by(cart_id=cart.id).all():
            db.delete(item)
    create_notification(db, order.user_id, "payment_success", "Payment successful", f"Payment received for order {order.order_number}.", {"order_id": order.order_number})
    reward_first_paid_order_referral(db, order)
    schedule_order_reorder_reminder(db, order)
    db.commit()
    db.refresh(order)
    return order


@router.post("/razorpay/order")
def create_razorpay_order(payload: RazorpayOrderIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=payload.order_id, customer_phone=user["sub"]).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    amount = money(order.payable_amount if order.payable_amount is not None else order.total)
    if amount <= 0:
        order.payment_status = "paid"
        db.commit()
        return {"mode": "wallet", "order_id": order.order_number, "amount": 0, "currency": "INR", "message": "Order paid by wallet."}
    amount_paise = int(round(amount * 100))
    payment = Payment(order_id=order.id, provider="razorpay", amount=amount, status="created")
    db.add(payment)
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        if settings.environment == "production":
            raise HTTPException(status_code=500, detail="Razorpay live keys are not configured")
        payment.provider_order_id = f"demo_{order.order_number}"
        payment.status = "demo_created"
        db.commit()
        return {
            "mode": "demo",
            "provider": "razorpay",
            "order_id": order.order_number,
            "razorpay_order_id": payment.provider_order_id,
            "amount": amount_paise,
            "currency": "INR",
            "message": "Demo payment mode: Razorpay keys are not configured."
        }
    try:
        provider_order = razorpay_provider.create_order(amount_paise=amount_paise, receipt=order.order_number)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not create payment order") from exc
    payment.provider_order_id = provider_order["id"]
    db.commit()
    return {"mode": "live", "key": settings.razorpay_key_id, **provider_order}


@router.post("/razorpay/verify")
def verify_payment(payload: PaymentVerifyIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=payload.order_id, customer_phone=user["sub"]).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if payload.demo:
        if settings.environment == "production":
            raise HTTPException(status_code=400, detail="Demo payment verification is disabled in production")
        payment = db.query(Payment).filter_by(order_id=order.id, provider_order_id=payload.razorpay_order_id).first()
        if not payment or not payload.razorpay_order_id.startswith("demo_"):
            raise HTTPException(status_code=400, detail="Invalid demo payment")
        return {"verified": True, "order": mark_paid(db, order, payload.razorpay_payment_id, payload.razorpay_signature, demo=True).order_number}
    if not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay key secret is not configured")
    existing_payment = db.query(Payment).filter_by(provider_payment_id=payload.razorpay_payment_id).first()
    if existing_payment:
        if existing_payment.order_id != order.id:
            raise HTTPException(status_code=409, detail="Payment id is already linked to another order")
        if order.payment_status in {"paid", "demo_paid"}:
            return {"verified": True, "duplicate": True, "order": order.order_number}
    if not razorpay_provider.verify_checkout_signature(razorpay_order_id=payload.razorpay_order_id, razorpay_payment_id=payload.razorpay_payment_id, signature=payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    try:
        provider_payment = razorpay_provider.fetch_payment(payload.razorpay_payment_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not verify payment capture status") from exc
    expected_amount = int(round(money(order.payable_amount if order.payable_amount is not None else order.total) * 100))
    if provider_payment.get("order_id") != payload.razorpay_order_id or provider_payment.get("status") != "captured" or int(provider_payment.get("amount", 0)) != expected_amount:
        raise HTTPException(status_code=400, detail="Payment provider status does not match order")
    payment = db.query(Payment).filter_by(order_id=order.id, provider_order_id=payload.razorpay_order_id).first()
    if payment:
        payment.provider_payment_id = payload.razorpay_payment_id
        payment.provider_signature = payload.razorpay_signature
    return {"verified": True, "duplicate": False, "order": mark_paid(db, order, payload.razorpay_payment_id, payload.razorpay_signature).order_number}


@router.post("/razorpay/failure")
def payment_failed(payload: PaymentFailureIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=payload.order_id, customer_phone=user["sub"]).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status in {"paid", "demo_paid"}:
        return {"order_id": order.order_number, "payment_status": order.payment_status}
    order.payment_status = "payment_failed"
    order.status = "pending_payment"
    release_order_inventory(db, order, payload.reason)
    create_notification(db, order.user_id, "payment_failed", "Payment failed", f"Payment failed for order {order.order_number}.", {"order_id": order.order_number, "reason": payload.reason})
    db.commit()
    return {"order_id": order.order_number, "payment_status": order.payment_status}


@router.post("/admin/{order_id}/refund")
def admin_refund(order_id: str, payload: RefundIn = Body(...), admin: dict = Depends(require_admin_permission("payments.refund")), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status not in {"paid", "demo_paid", "refunded", "partially_refunded"}:
        raise HTTPException(status_code=400, detail="Only paid orders can be refunded")
    refundable = money(order.total)
    already_refunded = sum(money(row.amount) for payment in db.query(Payment).filter_by(order_id=order.id).all() for row in db.query(Refund).filter_by(payment_id=payment.id).all())
    if already_refunded + payload.amount > refundable:
        raise HTTPException(status_code=400, detail="Refund amount exceeds order total")
    payment = db.query(Payment).filter_by(order_id=order.id).first()
    if not payment:
        payment = Payment(order_id=order.id, provider="wallet", amount=order.total, status="paid")
        db.add(payment)
        db.flush()
    refund = Refund(payment_id=payment.id, amount=payload.amount, status="requested", reason=payload.reason)
    db.add(refund)
    db.flush()
    create_provider_refund(db, payment, refund)
    db.add(WalletTransaction(user_id=order.user_id, order_id=order.id, amount=payload.amount, transaction_type="refund", reason=payload.reason))
    order.payment_status = "refunded" if already_refunded + payload.amount >= refundable else "partially_refunded"
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="refund", entity=f"order:{order.order_number}", metadata_json=f'{{"amount":{payload.amount}}}'))
    create_notification(db, order.user_id, "refund_initiated", "Refund initiated", f"Refund initiated for order {order.order_number}.", {"order_id": order.order_number, "amount": payload.amount})
    db.commit()
    db.refresh(order)
    return {"order_id": order.order_number, "payment_status": order.payment_status, "refunded": round(already_refunded + payload.amount, 2)}


@router.post("/admin/{order_id}/manual")
def admin_manual_payment(order_id: str, payload: ManualPaymentIn, admin: dict = Depends(require_admin_permission("payments.manual")), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payment = Payment(
        order_id=order.id,
        provider="manual",
        method=payload.method,
        amount=payload.amount_received,
        status=payload.status,
        transaction_reference=payload.transaction_reference,
        note=payload.note,
        proof_url=payload.proof_url,
        received_at=payload.payment_date or (datetime.utcnow() if payload.amount_received else None),
    )
    db.add(payment)
    order.payment_method = payload.method
    if payload.status == "paid":
        order.payment_status = "paid"
        commit_order_inventory(db, order)
        reward_first_paid_order_referral(db, order)
        schedule_order_reorder_reminder(db, order)
    elif payload.status == "partial":
        order.payment_status = "partially_paid"
    else:
        order.payment_status = "pending"
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="manual_payment_record", entity=f"order:{order.order_number}", metadata_json=f'{{"method":"{payload.method}","amount":{payload.amount_received}}}'))
    create_notification(db, order.user_id, "payment_update", "Payment updated", f"Payment status for order {order.order_number} is {order.payment_status}.", {"order_id": order.order_number})
    db.commit()
    db.refresh(order)
    return {"order_id": order.order_number, "payment_status": order.payment_status, "method": payload.method, "amount_received": payload.amount_received}


@router.post("/razorpay/webhook")
async def webhook(request: Request, x_razorpay_signature: str | None = Header(default=None), db: Session = Depends(get_db)):
    body = await request.body()
    if settings.environment == "production" and not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=500, detail="Payment webhook secret is not configured")
    if not razorpay_provider.verify_webhook_signature(body, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    payload = await request.json()
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    event_id = razorpay_provider.webhook_event_id(payload)
    if db.query(PaymentWebhook).filter_by(event_id=event_id).first():
        return {"received": True, "duplicate": True}
    db.add(PaymentWebhook(event_id=event_id, payload_json=dumps_provider_payload(payload)))
    event_name = payload.get("event")
    if event_name == "payment.captured":
        receipt = entity.get("notes", {}).get("receipt")
        order = db.query(Order).filter_by(order_number=receipt).first() if receipt else None
        if not order and entity.get("order_id"):
            payment = db.query(Payment).filter_by(provider_order_id=entity.get("order_id")).first()
            order = db.query(Order).filter_by(id=payment.order_id).first() if payment else None
        if order:
            mark_paid(db, order, entity.get("id"), x_razorpay_signature)
    elif event_name == "payment.failed":
        payment = db.query(Payment).filter_by(provider_order_id=entity.get("order_id")).first() if entity.get("order_id") else None
        order = db.query(Order).filter_by(id=payment.order_id).first() if payment else None
        if order and order.payment_status not in {"paid", "demo_paid"}:
            order.payment_status = "payment_failed"
            release_order_inventory(db, order, "webhook_payment_failed")
            create_notification(db, order.user_id, "payment_failed", "Payment failed", f"Payment failed for order {order.order_number}.", {"order_id": order.order_number})
    elif event_name in {"refund.processed", "refund.failed"}:
        refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
        refund = db.query(Refund).filter_by(provider_refund_id=refund_entity.get("id")).first()
        if refund:
            refund.status = "processed" if event_name == "refund.processed" else "failed"
            refund.payload_json = dumps_provider_payload(refund_entity)
    db.commit()
    return {"received": True, "duplicate": False}
