from datetime import datetime, timedelta
import json
from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import and_
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Order, OrderItem, ReminderSchedule, ReminderDeliveryOutbox, Subscription, SubscriptionDelivery, User, WalletTransaction
from app.services.business_rules import wallet_points
from app.services.inventory_lifecycle import reserve_order_inventory, commit_order_inventory
from app.services.reminders import schedule_subscription_reminder
from app.services.store import get_or_create_user, money, variant_by_slug_weight, wallet_balance

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class SubscriptionIn(BaseModel):
    slug: str
    weight_kg: int = 10
    quantity: int = Field(default=1, ge=1, le=20)
    cadence: str = "30_days"
    next_delivery_at: datetime | None = None
    wallet_auto_deduct: bool = True


class SubscriptionStatus(BaseModel):
    active: bool | None = None
    status: str | None = None
    next_delivery_at: datetime | None = None
    quantity: int | None = Field(default=None, ge=1, le=20)
    wallet_auto_deduct: bool | None = None


class DeliveryAction(BaseModel):
    scheduled_for: datetime | None = None
    note: str | None = Field(default=None, max_length=240)


class VacationIn(BaseModel):
    start_date: datetime
    end_date: datetime
    note: str | None = Field(default="Vacation hold", max_length=240)


def days_for_cadence(cadence: str) -> int:
    if cadence == "15_days":
        return 15
    if cadence == "30_days":
        return 30
    raise HTTPException(status_code=400, detail="Cadence must be 15_days or 30_days")


def subscription_amount(row: Subscription) -> float:
    return round(money(row.variant.price) * row.quantity * (1 - row.discount_percent / 100), 2)


def serialize_delivery(row: SubscriptionDelivery) -> dict:
    return {
        "id": row.id,
        "subscription_id": row.subscription_id,
        "order_id": row.order.order_number if row.order else None,
        "scheduled_for": row.scheduled_for.isoformat(),
        "status": row.status,
        "wallet_amount": money(row.wallet_amount),
        "payable_amount": money(row.payable_amount),
        "note": row.note,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def serialize_subscription(row: Subscription, include_deliveries: bool = True) -> dict:
    data = {
        "id": row.id,
        "slug": row.variant.product.slug,
        "name": row.variant.product.name,
        "weight_kg": row.variant.weight_kg,
        "quantity": row.quantity,
        "cadence": row.cadence,
        "discount_percent": row.discount_percent,
        "amount": subscription_amount(row),
        "next_delivery_at": row.next_delivery_at.isoformat() if row.next_delivery_at else None,
        "wallet_auto_deduct": row.wallet_auto_deduct,
        "status": row.status,
        "active": row.active,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }
    if include_deliveries:
        deliveries = sorted(getattr(row, "deliveries", []) or [], key=lambda item: item.scheduled_for)
        data["deliveries"] = [serialize_delivery(item) for item in deliveries[:8]]
    return data


def ensure_next_delivery(db: Session, row: Subscription) -> SubscriptionDelivery | None:
    if not row.active or row.status not in {"active", "payment_due"}:
        return None
    scheduled_for = row.next_delivery_at or datetime.utcnow()
    delivery = (
        db.query(SubscriptionDelivery)
        .filter_by(subscription_id=row.id, scheduled_for=scheduled_for)
        .first()
    )
    if not delivery:
        delivery = SubscriptionDelivery(
            subscription_id=row.id,
            user_id=row.user_id,
            scheduled_for=scheduled_for,
            status="scheduled",
            wallet_amount=0,
            payable_amount=subscription_amount(row),
        )
        db.add(delivery)
        db.flush()
    return delivery


def advance_next_delivery(db: Session, row: Subscription) -> None:
    row.next_delivery_at = (row.next_delivery_at or datetime.utcnow()) + timedelta(days=days_for_cadence(row.cadence))
    ensure_next_delivery(db, row)
    schedule_subscription_reminder(db, row)


def write_audit(db: Session, admin: dict, action: str, entity: str, metadata: dict | None = None) -> None:
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action=action, entity=entity, metadata_json=json.dumps(metadata or {})))


def generate_subscription_order(db: Session, row: Subscription, delivery: SubscriptionDelivery | None = None) -> dict:
    db.refresh(row, with_for_update=True)
    if row.status in {"cancelled", "paused"} or not row.active:
        raise HTTPException(status_code=400, detail="Subscription is not active")
    delivery = delivery or ensure_next_delivery(db, row)
    if not delivery:
        raise HTTPException(status_code=400, detail="No scheduled delivery")
    if delivery.status == "skipped":
        advance_next_delivery(db, row)
        delivery.status = "skipped"
        db.commit()
        return {"subscription": serialize_subscription(row), "delivery": serialize_delivery(delivery), "payment_status": "skipped"}
    if delivery.order_id:
        return {"subscription": serialize_subscription(row), "delivery": serialize_delivery(delivery), "order_id": delivery.order.order_number, "payment_status": delivery.order.payment_status}

    subtotal = subscription_amount(row)
    user = db.query(User).filter_by(id=row.user_id).with_for_update().first()
    if not user or user.blocked:
        raise HTTPException(status_code=409, detail="Customer account is unavailable")
    if not row.variant.product.active:
        raise HTTPException(status_code=409, detail="Product variant is unavailable")
    wallet_available = wallet_balance(db, row.user_id)
    wallet_applied = subtotal if row.wallet_auto_deduct and user.wallet_active and wallet_available >= subtotal else 0
    payment_status = "paid" if wallet_applied >= subtotal else "payment_due"
    order = Order(
        user_id=row.user_id,
        order_number=f"WR-SUB-{row.id}-{delivery.id}",
        customer_phone=user.phone if user else None,
        delivery_area="Subscription",
        delivery_eta=delivery.scheduled_for.strftime("%d %b %Y"),
        status="placed",
        payment_status=payment_status,
        subtotal=subtotal,
        discount_total=0,
        delivery_charge=0,
        wallet_amount=wallet_applied,
        payable_amount=max(0, subtotal - wallet_applied),
        total=subtotal,
    )
    db.add(order)
    db.flush()
    db.add(OrderItem(order_id=order.id, variant_id=row.variant_id, quantity=row.quantity, unit_price=subtotal / row.quantity, subscription=True))
    reserve_order_inventory(db, order, [(row, row.variant, subtotal / row.quantity)])
    db.flush()
    if wallet_applied:
        commit_order_inventory(db, order)
        db.add(WalletTransaction(user_id=row.user_id, order_id=order.id, amount=-wallet_applied, transaction_type="subscription_deduction", reason=f"{row.cadence}_subscription"))
        db.add(WalletTransaction(user_id=row.user_id, order_id=order.id, amount=wallet_points(subtotal), transaction_type="credit", reason="order_earned"))
        row.status = "active"
        delivery.status = "paid"
    else:
        row.status = "payment_due"
        delivery.status = "payment_due"
    delivery.order_id = order.id
    delivery.wallet_amount = wallet_applied
    delivery.payable_amount = max(0, subtotal - wallet_applied)
    advance_next_delivery(db, row)
    db.commit()
    db.refresh(row)
    db.refresh(delivery)
    return {"subscription": serialize_subscription(row), "delivery": serialize_delivery(delivery), "order_id": order.order_number, "payment_status": order.payment_status}


@router.get("")
def list_subscriptions(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(Subscription).filter_by(user_id=record.id).order_by(Subscription.created_at.desc()).all()
    for row in rows:
        ensure_next_delivery(db, row)
    db.commit()
    return [serialize_subscription(row) for row in rows]


@router.post("")
def create_subscription(payload: SubscriptionIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    variant = variant_by_slug_weight(db, payload.slug, payload.weight_kg)
    if not variant:
        raise HTTPException(status_code=404, detail="Product variant not found")
    days_for_cadence(payload.cadence)
    row = Subscription(
        user_id=record.id,
        variant_id=variant.id,
        quantity=payload.quantity,
        cadence=payload.cadence,
        next_delivery_at=payload.next_delivery_at or (datetime.utcnow() + timedelta(days=days_for_cadence(payload.cadence))),
        wallet_auto_deduct=payload.wallet_auto_deduct,
        status="active",
        active=True,
    )
    db.add(row)
    db.flush()
    ensure_next_delivery(db, row)
    schedule_subscription_reminder(db, row)
    db.commit()
    db.refresh(row)
    return serialize_subscription(row)


@router.patch("/{subscription_id}")
def update_subscription(subscription_id: int, payload: SubscriptionStatus, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Subscription).filter_by(id=subscription_id, user_id=record.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if payload.quantity is not None:
        row.quantity = payload.quantity
    if payload.wallet_auto_deduct is not None:
        row.wallet_auto_deduct = payload.wallet_auto_deduct
    if payload.active is not None:
        row.active = payload.active
        row.status = "active" if payload.active else "paused"
    if payload.status is not None:
        if payload.status not in {"active", "paused", "cancelled", "payment_due"}:
            raise HTTPException(status_code=400, detail="Invalid subscription status")
        row.status = payload.status
        row.active = payload.status in {"active", "payment_due"}
    if payload.next_delivery_at is not None:
        row.next_delivery_at = payload.next_delivery_at
    sync_pending_deliveries(db, row)
    ensure_next_delivery(db, row)
    schedule_subscription_reminder(db, row)
    db.commit()
    db.refresh(row)
    return serialize_subscription(row)


def sync_pending_deliveries(db: Session, row: Subscription) -> None:
    for delivery in db.query(SubscriptionDelivery).filter_by(subscription_id=row.id).all():
        if delivery.order_id is None and delivery.status in {"scheduled", "paused", "cancelled"}:
            if row.status == "cancelled" or delivery.scheduled_for != row.next_delivery_at:
                delivery.status = "cancelled"
            elif not row.active:
                delivery.status = "paused"
            else:
                delivery.status = "scheduled"
                delivery.payable_amount = subscription_amount(row)
    if not row.active:
        for reminder in db.query(ReminderSchedule).filter_by(subscription_id=row.id).all():
            if reminder.status in {"queued", "processing", "failed"}:
                reminder.status = "cancelled"
                for outbox in db.query(ReminderDeliveryOutbox).filter_by(reminder_schedule_id=reminder.id).all():
                    if outbox.status in {"queued", "failed"}:
                        outbox.status = "cancelled"
    db.flush()


class AdminSubscriptionIn(SubscriptionIn):
    phone: str = Field(min_length=10, max_length=20)


def subscription_owner(db: Session, subscription_id: int) -> dict:
    row = db.query(Subscription).filter_by(id=subscription_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    user = db.query(User).filter_by(id=row.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"sub": user.phone, "role": "customer"}


@router.post("/admin")
def admin_create_subscription(payload: AdminSubscriptionIn, admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    if not db.query(User).filter_by(phone=payload.phone, blocked=False).first():
        raise HTTPException(status_code=404, detail="Active customer not found")
    result = create_subscription(SubscriptionIn(**payload.model_dump(exclude={"phone"})), {"sub": payload.phone, "role": "customer"}, db)
    write_audit(db, admin, "subscription_create", f"subscription:{result['id']}")
    db.commit()
    return result


@router.patch("/admin/{subscription_id}")
def admin_update_subscription(subscription_id: int, payload: SubscriptionStatus, admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    result = update_subscription(subscription_id, payload, subscription_owner(db, subscription_id), db)
    write_audit(db, admin, "subscription_update", f"subscription:{subscription_id}")
    db.commit()
    return result


@router.post("/admin/{subscription_id}/skip")
def admin_skip_subscription(subscription_id: int, payload: DeliveryAction, admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    result = skip_next_delivery(subscription_id, payload, subscription_owner(db, subscription_id), db)
    write_audit(db, admin, "subscription_skip", f"subscription:{subscription_id}")
    db.commit()
    return result


@router.post("/admin/{subscription_id}/vacation")
def admin_vacation_subscription(subscription_id: int, payload: VacationIn, admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    result = vacation_hold(subscription_id, payload, subscription_owner(db, subscription_id), db)
    write_audit(db, admin, "subscription_vacation", f"subscription:{subscription_id}")
    db.commit()
    return result


@router.get("/{subscription_id}/deliveries")
def list_deliveries(subscription_id: int, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Subscription).filter_by(id=subscription_id, user_id=record.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    ensure_next_delivery(db, row)
    db.commit()
    rows = db.query(SubscriptionDelivery).filter_by(subscription_id=row.id).order_by(SubscriptionDelivery.scheduled_for.asc()).limit(30).all()
    return [serialize_delivery(item) for item in rows]


@router.post("/{subscription_id}/skip")
def skip_next_delivery(subscription_id: int, payload: DeliveryAction = Body(default_factory=DeliveryAction), user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Subscription).filter_by(id=subscription_id, user_id=record.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    delivery = ensure_next_delivery(db, row)
    if payload.scheduled_for:
        delivery = db.query(SubscriptionDelivery).filter_by(subscription_id=row.id, scheduled_for=payload.scheduled_for).first() or delivery
    if not delivery or delivery.status not in {"scheduled", "payment_due"}:
        raise HTTPException(status_code=400, detail="Delivery cannot be skipped")
    delivery.status = "skipped"
    delivery.note = payload.note or "Skipped by customer"
    if delivery.scheduled_for == row.next_delivery_at:
        advance_next_delivery(db, row)
        schedule_subscription_reminder(db, row)
    db.commit()
    db.refresh(row)
    return serialize_subscription(row)


@router.post("/{subscription_id}/vacation")
def vacation_hold(subscription_id: int, payload: VacationIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Subscription).filter_by(id=subscription_id, user_id=record.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    ensure_next_delivery(db, row)
    deliveries = db.query(SubscriptionDelivery).filter(
        and_(
            SubscriptionDelivery.subscription_id == row.id,
            SubscriptionDelivery.scheduled_for >= payload.start_date,
            SubscriptionDelivery.scheduled_for <= payload.end_date,
            SubscriptionDelivery.status.in_(["scheduled", "payment_due"]),
        )
    ).all()
    for delivery in deliveries:
        delivery.status = "skipped"
        delivery.note = payload.note
    if row.next_delivery_at and payload.start_date <= row.next_delivery_at <= payload.end_date:
        row.next_delivery_at = payload.end_date + timedelta(days=days_for_cadence(row.cadence))
        ensure_next_delivery(db, row)
        schedule_subscription_reminder(db, row)
    db.commit()
    db.refresh(row)
    return serialize_subscription(row)


@router.get("/admin/upcoming")
def admin_upcoming(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(Subscription).order_by(Subscription.created_at.desc()).limit(300).all()
    for row in rows:
        ensure_next_delivery(db, row)
    db.commit()
    users = {user.id: user for user in db.query(User).filter(User.id.in_([row.user_id for row in rows])).all()}
    return [{**serialize_subscription(row), "phone": users[row.user_id].phone if row.user_id in users else None} for row in rows]


@router.get("/admin/deliveries")
def admin_deliveries(status: str | None = None, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(SubscriptionDelivery).order_by(SubscriptionDelivery.scheduled_for.asc())
    if status:
        query = query.filter_by(status=status)
    return [serialize_delivery(row) for row in query.limit(300).all()]


@router.post("/admin/{subscription_id}/generate-cycle")
def admin_generate_cycle(subscription_id: int, admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    row = db.query(Subscription).filter_by(id=subscription_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Subscription not found")
    result = generate_subscription_order(db, row)
    write_audit(db, admin, "subscription_generate_cycle", f"subscription:{row.id}", {"order_id": result.get("order_id")})
    db.commit()
    return result


@router.post("/admin/generate-due")
def admin_generate_due(admin: dict = Depends(require_admin_permission("subscriptions.write")), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    rows = db.query(Subscription).filter(Subscription.active == True, Subscription.next_delivery_at <= now, Subscription.status.in_(["active", "payment_due"])).limit(200).all()
    results = []
    for row in rows:
        try:
            results.append(generate_subscription_order(db, row))
        except HTTPException as exc:
            results.append({"subscription_id": row.id, "error": exc.detail})
    write_audit(db, admin, "subscription_generate_due", "subscriptions", {"count": len(results)})
    db.commit()
    return {"processed": len(results), "results": results}
