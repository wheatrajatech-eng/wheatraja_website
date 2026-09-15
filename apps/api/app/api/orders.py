from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AbandonedCartRecovery, AdminAuditLog, Cart, CartItem, Coupon, Order, OrderItem, Payment, User, WalletTransaction
from app.services.business_rules import delivery_charge, wallet_points
from app.services.inventory_lifecycle import commit_order_inventory, release_order_inventory, reserve_order_inventory
from app.services.notifications import create_notification
from app.services.referrals import apply_referral_code_to_user, reward_first_paid_order_referral
from app.services.reminders import schedule_order_reorder_reminder
from app.services.store import get_or_create_user, money, variant_by_slug_weight, wallet_balance

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    slug: str
    weight_kg: int
    quantity: int = Field(ge=1, le=20)
    subscription: bool = False


class OrderQuoteIn(BaseModel):
    items: list[OrderItemIn]
    coupon: str = ""
    distance_km: float = Field(ge=0)
    wallet_amount: float = Field(default=0, ge=0)


class OrderCreateIn(OrderQuoteIn):
    address: str = Field(min_length=10)
    delivery_area: str = "Noida"
    referral_code: str | None = Field(default=None, max_length=4)


class OrderStatusIn(BaseModel):
    status: str


class ManualOrderLineIn(BaseModel):
    slug: str
    weight_kg: int
    quantity: int = Field(ge=1, le=500)
    price_override: float | None = Field(default=None, ge=0)


class ManualOrderIn(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=160)
    shipping_address: str = Field(min_length=5, max_length=1000)
    billing_address: str | None = Field(default=None, max_length=1000)
    delivery_area: str = "Noida"
    items: list[ManualOrderLineIn] = Field(min_length=1)
    discount: float = Field(default=0, ge=0)
    shipping_charge: float = Field(default=0, ge=0)
    payment_method: str = Field(default="cod", max_length=60)
    payment_status: str = Field(default="pending", pattern="^(pending|partial|paid)$")
    amount_received: float = Field(default=0, ge=0)
    transaction_reference: str | None = Field(default=None, max_length=160)
    source_channel: str = Field(default="manual_admin", pattern="^(website|instagram|whatsapp|phone|walk_in|referral|manual_admin|marketplace|other)$")
    source_detail: str | None = Field(default=None, max_length=240)
    campaign_name: str | None = Field(default=None, max_length=160)
    admin_notes: str | None = None
    customer_notes: str | None = None
    expected_delivery_at: datetime | None = None


def calculate_quote(payload: OrderQuoteIn, db: Session, user_id: int | None = None):
    subtotal = 0.0
    lines = []
    for item in payload.items:
        variant = variant_by_slug_weight(db, item.slug, item.weight_kg)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Invalid variant: {item.slug} {item.weight_kg}kg")
        unit_price = money(variant.price) * (0.9 if item.subscription else 1)
        subtotal += unit_price * item.quantity
        lines.append((item, variant, unit_price))
    coupon_row = db.query(Coupon).filter_by(code=payload.coupon.strip().upper(), active=True).first() if payload.coupon else None
    coupon = {"valid": bool(coupon_row), "discount": round(subtotal * (coupon_row.percent_off / 100), 2) if coupon_row else 0}
    delivery = delivery_charge(payload.distance_km)
    if not delivery["deliverable"]:
        raise HTTPException(status_code=400, detail="Address is outside delivery radius")
    total = subtotal - coupon["discount"] + delivery["charge"]
    available_wallet = wallet_balance(db, user_id) if user_id else 0
    wallet_applied = min(float(payload.wallet_amount or 0), float(available_wallet), float(total))
    payable = max(0, total - wallet_applied)
    return {
        "lines": lines,
        "totals": {
            "subtotal": round(subtotal, 2),
            "coupon_discount": round(coupon["discount"], 2),
            "delivery_charge": delivery["charge"],
            "wallet_balance": available_wallet,
            "wallet_applied": round(wallet_applied, 2),
            "wallet_earned": wallet_points(payable if payable > 0 else total),
            "free_gift": subtotal >= 999,
            "total": round(total, 2),
            "payable": round(payable, 2)
        }
    }


def serialize_order(order: Order) -> dict:
    return {
        "id": order.order_number,
        "database_id": order.id,
        "phone": order.customer_phone,
        "address": order.address_text,
        "delivery_area": order.delivery_area,
        "delivery_eta": order.delivery_eta,
        "source_channel": order.source_channel,
        "source_detail": order.source_detail,
        "payment_method": order.payment_method,
        "admin_notes": order.admin_notes,
        "customer_notes": order.customer_notes,
        "expected_delivery_at": order.expected_delivery_at.isoformat() if order.expected_delivery_at else None,
        "status": order.status,
        "payment_status": order.payment_status,
        "subtotal": money(order.subtotal),
        "coupon_discount": money(order.discount_total),
        "delivery_charge": money(order.delivery_charge),
        "wallet_amount": money(order.wallet_amount),
        "payable_amount": money(order.payable_amount),
        "total": money(order.total),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "slug": item.variant.product.slug,
                "name": item.variant.product.name,
                "weight_kg": item.variant.weight_kg,
                "quantity": item.quantity,
                "unit_price": money(item.unit_price),
                "subscription": item.subscription
            }
            for item in order.items
        ]
    }


@router.post("/quote")
def quote(payload: OrderQuoteIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    return calculate_quote(payload, db, record.id)["totals"]


@router.post("")
def create_order(payload: OrderCreateIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    if payload.referral_code:
        apply_referral_code_to_user(db, record, payload.referral_code)
    quote_data = calculate_quote(payload, db, record.id)
    order_number = f"WR{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}{record.id}"
    payment_status = "paid" if quote_data["totals"]["payable"] <= 0 else "pending_payment"
    order = Order(
        user_id=record.id,
        order_number=order_number,
        customer_phone=record.phone,
        address_text=payload.address,
        delivery_area=payload.delivery_area,
        delivery_eta="Same-day" if payload.distance_km <= 20 else "Next-route delivery",
        source_channel="website",
        created_by="customer",
        status="placed" if payment_status == "paid" else "pending_payment",
        payment_status=payment_status,
        subtotal=quote_data["totals"]["subtotal"],
        discount_total=quote_data["totals"]["coupon_discount"],
        delivery_charge=quote_data["totals"]["delivery_charge"],
        wallet_amount=quote_data["totals"]["wallet_applied"],
        payable_amount=quote_data["totals"]["payable"],
        total=quote_data["totals"]["total"]
    )
    db.add(order)
    db.flush()
    reserve_order_inventory(db, order, quote_data["lines"])
    for item, variant, unit_price in quote_data["lines"]:
        db.add(OrderItem(order_id=order.id, variant_id=variant.id, quantity=item.quantity, unit_price=unit_price, subscription=item.subscription))
    if quote_data["totals"]["wallet_applied"] > 0:
        db.add(WalletTransaction(user_id=record.id, order_id=order.id, amount=-quote_data["totals"]["wallet_applied"], transaction_type="order_payment", reason="wallet_order_payment"))
    recovery = db.query(AbandonedCartRecovery).filter_by(user_id=record.id, status="open").order_by(AbandonedCartRecovery.updated_at.desc()).first()
    if recovery:
        recovery.status = "converted"
        recovery.converted_order_id = order.id
    if payment_status == "paid":
        commit_order_inventory(db, order)
        db.add(WalletTransaction(user_id=record.id, order_id=order.id, amount=quote_data["totals"]["wallet_earned"], transaction_type="credit", reason="order_earned"))
        create_notification(db, record.id, "order_paid", "Order paid", f"Your order {order.order_number} is confirmed.", {"order_id": order.order_number})
        reward_first_paid_order_referral(db, order)
        schedule_order_reorder_reminder(db, order)
    cart = db.query(Cart).filter_by(user_id=record.id).first()
    if cart:
        for row in db.query(CartItem).filter_by(cart_id=cart.id).all():
            db.delete(row)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.get("")
def list_orders(skip: int = 0, limit: int = 100, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    return [serialize_order(order) for order in db.query(Order).filter_by(user_id=record.id).order_by(Order.created_at.desc()).offset(skip).limit(min(limit, 200)).all()]


@router.get("/{order_id}")
def get_order(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)


@router.get("/{order_id}/reorder-items")
def reorder_items(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "order_id": order.order_number,
        "items": [
            {
                "slug": item.variant.product.slug,
                "weight_kg": item.variant.weight_kg,
                "quantity": item.quantity,
                "subscription": item.subscription,
            }
            for item in order.items
            if item.variant and item.variant.product and item.variant.product.active
        ],
    }


@router.post("/{order_id}/reorder-to-cart")
def reorder_to_cart(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    cart = db.query(Cart).filter_by(user_id=record.id).first()
    if not cart:
        cart = Cart(user_id=record.id)
        db.add(cart)
        db.flush()
    added = 0
    for item in order.items:
        if not item.variant or not item.variant.product or not item.variant.product.active:
            continue
        existing = db.query(CartItem).filter_by(cart_id=cart.id, variant_id=item.variant_id, subscription=item.subscription).first()
        if existing:
            existing.quantity = min(20, existing.quantity + item.quantity)
        else:
            db.add(CartItem(cart_id=cart.id, variant_id=item.variant_id, quantity=min(20, item.quantity), subscription=item.subscription))
        added += 1
    db.commit()
    return {"order_id": order.order_number, "added_lines": added}


@router.post("/admin/manual")
def create_manual_order(payload: ManualOrderIn, admin: dict = Depends(require_admin_permission("orders:write")), db: Session = Depends(get_db)):
    record = get_or_create_user(db, payload.phone, "customer")
    if payload.name is not None:
        record.name = payload.name
    if payload.email is not None:
        record.email = payload.email
    if getattr(record, "blocked", False):
        raise HTTPException(status_code=400, detail="Customer is blocked")
    lines = []
    subtotal = 0.0
    for item in payload.items:
        variant = variant_by_slug_weight(db, item.slug, item.weight_kg)
        if not variant:
            raise HTTPException(status_code=400, detail=f"Invalid variant: {item.slug} {item.weight_kg}kg")
        unit_price = item.price_override if item.price_override is not None else money(variant.price)
        subtotal += unit_price * item.quantity
        lines.append((item, variant, unit_price))
    total = max(0, subtotal - payload.discount + payload.shipping_charge)
    payment_status = "paid" if payload.payment_status == "paid" else "partial" if payload.payment_status == "partial" else "pending"
    order = Order(
        user_id=record.id,
        order_number=f"WRM{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}{record.id}",
        customer_phone=record.phone,
        address_text=payload.shipping_address,
        billing_address_text=payload.billing_address,
        delivery_area=payload.delivery_area,
        delivery_eta="Manual delivery",
        status="placed",
        payment_status=payment_status,
        subtotal=round(subtotal, 2),
        discount_total=payload.discount,
        delivery_charge=payload.shipping_charge,
        wallet_amount=0,
        payable_amount=max(0, total - payload.amount_received),
        total=round(total, 2),
        source_channel=payload.source_channel,
        source_detail=payload.source_detail,
        campaign_name=payload.campaign_name,
        created_by="admin",
        admin_owner_id=get_or_create_user(db, admin["sub"], "admin").id,
        admin_notes=payload.admin_notes,
        customer_notes=payload.customer_notes,
        expected_delivery_at=payload.expected_delivery_at,
        payment_method=payload.payment_method,
    )
    db.add(order)
    db.flush()
    reserve_order_inventory(db, order, lines)
    for item, variant, unit_price in lines:
        db.add(OrderItem(order_id=order.id, variant_id=variant.id, quantity=item.quantity, unit_price=unit_price, subscription=False))
    payment = Payment(order_id=order.id, provider="manual", method=payload.payment_method, transaction_reference=payload.transaction_reference, amount=payload.amount_received, status=payment_status, received_at=datetime.utcnow() if payload.amount_received else None, note=payload.admin_notes)
    db.add(payment)
    if payment_status == "paid":
        commit_order_inventory(db, order)
        reward_first_paid_order_referral(db, order)
        schedule_order_reorder_reminder(db, order)
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="manual_order_create", entity=f"order:{order.order_number}", metadata_json=f'{{"source":"{payload.source_channel}","payment_method":"{payload.payment_method}"}}'))
    create_notification(db, record.id, "order_placed", "Order created", f"Order {order.order_number} was created.", {"order_id": order.order_number, "source": payload.source_channel})
    db.commit()
    db.refresh(order)
    return serialize_order(order)


@router.post("/{order_id}/cancel")
def cancel_order(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in {"pending_payment", "placed", "milling"}:
        raise HTTPException(status_code=400, detail="Order can no longer be cancelled online")
    if order.payment_status in {"paid", "demo_paid"}:
        raise HTTPException(status_code=400, detail="Paid orders require admin refund review")
    order.status = "cancelled"
    order.payment_status = "cancelled"
    release_order_inventory(db, order, "customer_cancelled")
    create_notification(db, record.id, "order_cancelled", "Order cancelled", f"Order {order.order_number} was cancelled.", {"order_id": order.order_number})
    db.commit()
    return serialize_order(order)


@router.get("/admin/all/list")
def admin_orders(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return [serialize_order(order) for order in db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(min(limit, 200)).all()]


@router.patch("/admin/{order_id}/status")
def admin_update_status(order_id: str, payload: OrderStatusIn, admin: dict = Depends(require_admin_permission("orders:write")), db: Session = Depends(get_db)):
    allowed = {"pending_payment", "placed", "milling", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = db.query(Order).filter_by(order_number=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    if payload.status == "cancelled" and order.payment_status in {"pending_payment", "payment_failed", "reservation_expired"}:
        release_order_inventory(db, order, "admin_cancelled")
    if payload.status == "delivered" and order.payment_status in {"paid", "demo_paid"}:
        points = wallet_points(money(order.total))
        existing = db.query(WalletTransaction).filter_by(user_id=order.user_id, order_id=order.id, reason="order_earned").first()
        if not existing:
            db.add(WalletTransaction(user_id=order.user_id, order_id=order.id, amount=points, transaction_type="credit", reason="order_earned"))
    create_notification(db, order.user_id, "order_status", "Order status updated", f"Order {order.order_number} is now {payload.status}.", {"order_id": order.order_number, "status": payload.status})
    db.commit()
    db.refresh(order)
    return serialize_order(order)
