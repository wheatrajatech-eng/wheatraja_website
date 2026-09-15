import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import (
    AbandonedCartRecovery,
    AdminAuditLog,
    BlogPost,
    BlogProductLink,
    CustomerSegment,
    DeliverySlot,
    LoyaltyTier,
    Order,
    OrderItem,
    Product,
    ProductRecommendation,
    ProductVariant,
    SupportTicket,
    User,
    WalletTransaction,
)
from app.services.store import get_or_create_user, money, serialize_product, wallet_balance

router = APIRouter(prefix="/growth", tags=["growth"])


class RecoveryItemIn(BaseModel):
    slug: str
    weight_kg: int = Field(ge=1)
    quantity: int = Field(ge=1, le=100)
    subscription: bool = False


class RecoveryCartIn(BaseModel):
    items: list[RecoveryItemIn] = Field(default_factory=list)
    subtotal: float = Field(default=0, ge=0)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=180)
    session_id: str | None = Field(default=None, max_length=120)
    checkout_started: bool = False


class SupportTicketIn(BaseModel):
    order_id: str | None = None
    category: str = Field(default="general", pattern="^(general|order|delivery|refund|product|subscription|payment)$")
    subject: str = Field(min_length=3, max_length=180)
    message: str = Field(min_length=5, max_length=3000)
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")


class SupportTicketUpdate(BaseModel):
    status: str = Field(pattern="^(open|waiting_customer|in_progress|resolved|closed)$")
    priority: str | None = Field(default=None, pattern="^(low|normal|high|urgent)$")
    resolution_note: str | None = None


class DeliverySlotIn(BaseModel):
    zone: str = Field(default="Noida Core", max_length=120)
    pincode: str | None = Field(default=None, max_length=12)
    starts_at: datetime
    ends_at: datetime
    capacity: int = Field(default=25, ge=1, le=500)
    active: bool = True


class RecoveryUpdate(BaseModel):
    status: str = Field(pattern="^(open|reminded|dismissed)$")
    channel: str = Field(default="email", pattern="^(email|whatsapp|phone|in_app)$")


class BlogProductLinkIn(BaseModel):
    slug: str
    product_slug: str
    rank: int = Field(default=100, ge=0, le=9999)
    cta_text: str | None = Field(default="Shop this atta", max_length=80)


class RecommendationIn(BaseModel):
    source_slug: str | None = None
    target_slug: str
    placement: str = Field(default="similar", max_length=80)
    rank: int = Field(default=100, ge=0, le=9999)
    reason: str | None = Field(default=None, max_length=240)
    active: bool = True


class ProductQuizIn(BaseModel):
    family_size: int = Field(default=4, ge=1, le=20)
    rotis_per_day: int = Field(default=12, ge=1, le=200)
    preference: str = Field(default="soft_rotis", pattern="^(soft_rotis|nutrition|premium|budget|mixed)$")
    delivery_cycle_days: int = Field(default=30, ge=7, le=60)


def parse_json_list(raw: str | None) -> list:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return []
    return value if isinstance(value, list) else []


def audit(db: Session, admin: dict, action: str, entity: str, metadata: dict | None = None) -> None:
    user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=user.id, action=action, entity=entity, metadata_json=json.dumps(metadata or {})))


def serialize_recovery(row: AbandonedCartRecovery) -> dict:
    return {
        "id": row.id,
        "user_id": row.user_id,
        "phone": row.phone,
        "email": row.email,
        "session_id": row.session_id,
        "items": parse_json_list(row.cart_json),
        "subtotal": money(row.subtotal),
        "status": row.status,
        "recovery_channel": row.recovery_channel,
        "last_reminder_at": row.last_reminder_at.isoformat() if row.last_reminder_at else None,
        "checkout_started_at": row.checkout_started_at.isoformat() if row.checkout_started_at else None,
        "converted_order_id": row.converted_order_id,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def serialize_tier(row: LoyaltyTier) -> dict:
    return {
        "name": row.name,
        "min_points": row.min_points,
        "reward_multiplier": money(row.reward_multiplier),
        "perks": parse_json_list(row.perks_json),
    }


def serialize_ticket(row: SupportTicket) -> dict:
    return {
        "id": row.id,
        "ticket_number": row.ticket_number,
        "user_id": row.user_id,
        "order_id": row.order_id,
        "category": row.category,
        "subject": row.subject,
        "message": row.message,
        "status": row.status,
        "priority": row.priority,
        "resolution_note": row.resolution_note,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def serialize_slot(row: DeliverySlot) -> dict:
    return {
        "id": row.id,
        "zone": row.zone,
        "pincode": row.pincode,
        "starts_at": row.starts_at.isoformat(),
        "ends_at": row.ends_at.isoformat(),
        "capacity": row.capacity,
        "booked_count": row.booked_count,
        "available": row.active and row.booked_count < row.capacity,
        "active": row.active,
    }


def recommendation_products(db: Session, source_slug: str | None = None, placement: str | None = None, limit: int = 3) -> list[dict]:
    source_id = None
    if source_slug:
        source = db.query(Product).filter_by(slug=source_slug, active=True).first()
        if not source:
            raise HTTPException(status_code=404, detail="Source product not found")
        source_id = source.id
    query = db.query(ProductRecommendation).filter_by(active=True)
    if source_id is not None:
        query = query.filter(or_(ProductRecommendation.source_product_id == source_id, ProductRecommendation.source_product_id.is_(None)))
    if placement:
        query = query.filter(ProductRecommendation.placement == placement)
    links = query.order_by(ProductRecommendation.rank.asc(), ProductRecommendation.created_at.desc()).limit(min(limit, 12)).all()
    products = []
    seen = set()
    for link in links:
        product = db.query(Product).filter_by(id=link.target_product_id, active=True).first()
        if product and product.id not in seen:
            row = serialize_product(product)
            row["recommendation_reason"] = link.reason
            row["placement"] = link.placement
            products.append(row)
            seen.add(product.id)
    if len(products) < limit:
        fallback_query = db.query(Product).filter_by(active=True)
        if source_id is not None:
            fallback_query = fallback_query.filter(Product.id != source_id)
        for product in fallback_query.order_by(Product.featured.desc(), Product.name.asc()).limit(limit).all():
            if product.id not in seen:
                products.append(serialize_product(product))
                seen.add(product.id)
    return products[:limit]


def assign_customer_segments(db: Session, user_id: int) -> list[str]:
    orders = db.query(Order).filter_by(user_id=user_id).all()
    subscriptions = sum(1 for order in orders for item in order.items if item.subscription)
    paid_orders = [order for order in orders if order.payment_status in {"paid", "demo_paid"}]
    segments = []
    if not orders:
        segments.append("new_customer")
    if len(paid_orders) >= 2:
        segments.append("repeat_customer")
    if subscriptions:
        segments.append("subscription_customer")
    if sum(money(order.total) for order in paid_orders) >= 5000:
        segments.append("high_value")
    cutoff = datetime.utcnow() - timedelta(days=45)
    if paid_orders and max(order.created_at for order in paid_orders) < cutoff:
        segments.append("inactive")
    for segment in segments:
        existing = db.query(CustomerSegment).filter_by(user_id=user_id, segment=segment).first()
        if not existing:
            db.add(CustomerSegment(user_id=user_id, segment=segment, reason_json=json.dumps({"computed_at": datetime.utcnow().isoformat()})))
        else:
            existing.active = True
            existing.reason_json = json.dumps({"computed_at": datetime.utcnow().isoformat()})
    return segments


@router.post("/recovery/cart")
def upsert_recovery_cart(payload: RecoveryCartIn, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(phone=payload.phone).first() if payload.phone else None
    query = db.query(AbandonedCartRecovery).filter(AbandonedCartRecovery.status == "open")
    if user:
        row = query.filter(AbandonedCartRecovery.user_id == user.id).first()
    elif payload.session_id:
        row = query.filter(AbandonedCartRecovery.session_id == payload.session_id).first()
    else:
        row = None
    if not row:
        row = AbandonedCartRecovery(cart_json="[]")
        db.add(row)
    row.user_id = user.id if user else row.user_id
    row.phone = payload.phone or row.phone
    row.email = payload.email or row.email
    row.session_id = payload.session_id or row.session_id
    row.cart_json = json.dumps([item.model_dump() for item in payload.items])
    row.subtotal = payload.subtotal
    row.checkout_started_at = datetime.utcnow() if payload.checkout_started else row.checkout_started_at
    row.status = "open" if payload.items else "empty"
    db.commit()
    db.refresh(row)
    return serialize_recovery(row)


@router.get("/admin/recoveries")
def admin_recoveries(status: str | None = None, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(AbandonedCartRecovery)
    if status:
        query = query.filter_by(status=status)
    return [serialize_recovery(row) for row in query.order_by(AbandonedCartRecovery.updated_at.desc()).limit(200).all()]


@router.post("/admin/recoveries/{recovery_id}/mark-reminded")
def mark_recovery_reminded(recovery_id: int, channel: str = "email", admin: dict = Depends(require_admin_permission("growth.write")), db: Session = Depends(get_db)):
    row = db.query(AbandonedCartRecovery).filter_by(id=recovery_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Recovery record not found")
    row.recovery_channel = channel
    row.last_reminder_at = datetime.utcnow()
    row.status = "reminded"
    audit(db, admin, "cart_recovery_reminded", f"recovery:{row.id}", {"channel": channel})
    db.commit()
    return serialize_recovery(row)


@router.patch("/admin/recoveries/{recovery_id}")
def update_recovery(recovery_id: int, payload: RecoveryUpdate, admin: dict = Depends(require_admin_permission("growth.write")), db: Session = Depends(get_db)):
    row = db.query(AbandonedCartRecovery).filter_by(id=recovery_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Recovery record not found")
    if row.converted_order_id:
        raise HTTPException(status_code=409, detail="Converted carts cannot be reopened")
    row.status = payload.status
    row.recovery_channel = payload.channel
    if payload.status == "reminded":
        row.last_reminder_at = datetime.utcnow()
    audit(db, admin, "recovery_update", f"recovery:{row.id}", payload.model_dump())
    db.commit()
    return serialize_recovery(row)


@router.get("/loyalty/tiers")
def loyalty_tiers(db: Session = Depends(get_db)):
    return [serialize_tier(row) for row in db.query(LoyaltyTier).filter_by(active=True).order_by(LoyaltyTier.min_points.asc()).all()]


@router.get("/loyalty/me")
def my_loyalty(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    balance = wallet_balance(db, record.id)
    tiers = db.query(LoyaltyTier).filter_by(active=True).order_by(LoyaltyTier.min_points.asc()).all()
    current = tiers[0] if tiers else None
    next_tier = None
    for tier in tiers:
        if balance >= tier.min_points:
            current = tier
        elif not next_tier:
            next_tier = tier
    return {
        "points": balance,
        "tier": serialize_tier(current) if current else None,
        "next_tier": serialize_tier(next_tier) if next_tier else None,
        "points_to_next": max(0, (next_tier.min_points - balance)) if next_tier else 0,
        "segments": assign_customer_segments(db, record.id),
    }


@router.get("/recommendations")
def recommendations(source_slug: str | None = None, placement: str | None = None, limit: int = 3, db: Session = Depends(get_db)):
    return recommendation_products(db, source_slug, placement, min(limit, 12))


@router.post("/quiz")
def product_quiz(payload: ProductQuizIn, db: Session = Depends(get_db)):
    monthly_kg = max(1, round(payload.rotis_per_day * payload.delivery_cycle_days * 0.035))
    if payload.preference == "nutrition":
        preferred = "multigrain"
    elif payload.preference == "premium":
        preferred = "sharbati"
    elif payload.preference == "budget":
        preferred = "sehori"
    else:
        preferred = ""
    products = db.query(Product).filter_by(active=True).all()
    ranked = sorted(
        products,
        key=lambda product: (
            0 if preferred and preferred in f"{product.slug} {product.name}".lower() else 1,
            0 if product.featured else 1,
            product.name,
        ),
    )
    recommended_weight = 10 if monthly_kg >= 18 else 5 if monthly_kg >= 6 else 1
    return {
        "estimated_monthly_kg": monthly_kg,
        "recommended_weight_kg": recommended_weight,
        "recommended_cycle_days": payload.delivery_cycle_days,
        "subscription_recommended": monthly_kg >= 5,
        "products": [serialize_product(product) for product in ranked[:3]],
    }


@router.post("/support/tickets")
def create_support_ticket(payload: SupportTicketIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=payload.order_id, user_id=record.id).first() if payload.order_id else None
    if payload.order_id and not order:
        raise HTTPException(status_code=404, detail="Order not found")
    ticket = SupportTicket(
        ticket_number=f"WRS{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}{record.id}",
        user_id=record.id,
        order_id=order.id if order else None,
        category=payload.category,
        subject=payload.subject,
        message=payload.message,
        priority=payload.priority,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket)


@router.get("/support/tickets")
def my_support_tickets(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    return [serialize_ticket(row) for row in db.query(SupportTicket).filter_by(user_id=record.id).order_by(SupportTicket.created_at.desc()).limit(100).all()]


@router.get("/admin/support")
def admin_support(status: str | None = None, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(SupportTicket)
    if status:
        query = query.filter_by(status=status)
    return [serialize_ticket(row) for row in query.order_by(SupportTicket.created_at.desc()).limit(200).all()]


@router.patch("/admin/support/{ticket_number}")
def update_support_ticket(ticket_number: str, payload: SupportTicketUpdate, admin: dict = Depends(require_admin_permission("support.write")), db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).filter_by(ticket_number=ticket_number).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = payload.status
    if payload.priority:
        ticket.priority = payload.priority
    ticket.resolution_note = payload.resolution_note
    ticket.assigned_admin_id = get_or_create_user(db, admin["sub"], "admin").id
    audit(db, admin, "support_ticket_update", f"ticket:{ticket.ticket_number}", {"status": ticket.status})
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket)


@router.get("/delivery-slots")
def delivery_slots(pincode: str | None = None, db: Session = Depends(get_db)):
    query = db.query(DeliverySlot).filter(DeliverySlot.active == True, DeliverySlot.starts_at >= datetime.utcnow())
    if pincode:
        query = query.filter(or_(DeliverySlot.pincode == pincode, DeliverySlot.pincode.is_(None)))
    return [serialize_slot(row) for row in query.order_by(DeliverySlot.starts_at.asc()).limit(40).all()]


@router.post("/admin/delivery-slots")
def create_delivery_slot(payload: DeliverySlotIn, admin: dict = Depends(require_admin_permission("delivery_slots.write")), db: Session = Depends(get_db)):
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=400, detail="Slot end must be after start")
    row = DeliverySlot(**payload.model_dump(), booked_count=0)
    db.add(row)
    audit(db, admin, "delivery_slot_create", "delivery_slots", {"zone": payload.zone})
    db.commit()
    db.refresh(row)
    return serialize_slot(row)


@router.patch("/admin/delivery-slots/{slot_id}")
def update_delivery_slot(slot_id: int, payload: DeliverySlotIn, admin: dict = Depends(require_admin_permission("delivery_slots.write")), db: Session = Depends(get_db)):
    row = db.query(DeliverySlot).filter_by(id=slot_id).with_for_update().first()
    if not row:
        raise HTTPException(status_code=404, detail="Delivery slot not found")
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=422, detail="Slot end must be after start")
    if payload.capacity < row.booked_count:
        raise HTTPException(status_code=409, detail="Capacity cannot be below existing bookings")
    if row.booked_count and (payload.starts_at != row.starts_at or payload.ends_at != row.ends_at or payload.zone != row.zone or payload.pincode != row.pincode):
        raise HTTPException(status_code=409, detail="Booked slot time and location cannot change")
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    audit(db, admin, "delivery_slot_update", f"delivery_slot:{slot_id}")
    db.commit()
    return serialize_slot(row)


@router.delete("/admin/delivery-slots/{slot_id}")
def delete_delivery_slot(slot_id: int, admin: dict = Depends(require_admin_permission("delivery_slots.write")), db: Session = Depends(get_db)):
    row = db.query(DeliverySlot).filter_by(id=slot_id).with_for_update().first()
    if not row:
        raise HTTPException(status_code=404, detail="Delivery slot not found")
    if row.booked_count:
        raise HTTPException(status_code=409, detail="Booked slots cannot be deleted; deactivate instead")
    db.delete(row)
    audit(db, admin, "delivery_slot_delete", f"delivery_slot:{slot_id}")
    db.commit()
    return {"deleted": True}


@router.post("/admin/blog-product-links")
def upsert_blog_product_link(payload: BlogProductLinkIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=payload.slug).first()
    product = db.query(Product).filter_by(slug=payload.product_slug).first()
    if not post or not product:
        raise HTTPException(status_code=404, detail="Blog or product not found")
    row = db.query(BlogProductLink).filter_by(blog_post_id=post.id, product_id=product.id).first()
    if not row:
        row = BlogProductLink(blog_post_id=post.id, product_id=product.id)
        db.add(row)
    row.rank = payload.rank
    row.cta_text = payload.cta_text
    audit(db, admin, "blog_product_link_upsert", f"blog:{post.slug}", {"product": product.slug})
    db.commit()
    return {"ok": True, "blog": post.slug, "product": product.slug}


@router.get("/blogs/{slug}/products")
def blog_products(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    links = db.query(BlogProductLink).filter_by(blog_post_id=post.id).order_by(BlogProductLink.rank.asc()).limit(6).all()
    products = []
    for link in links:
        product = db.query(Product).filter_by(id=link.product_id, active=True).first()
        if product:
            row = serialize_product(product)
            row["cta_text"] = link.cta_text or "Shop this atta"
            products.append(row)
    return products or recommendation_products(db, limit=3)


@router.post("/admin/recommendations")
def upsert_recommendation(payload: RecommendationIn, admin: dict = Depends(require_admin_permission("growth.write")), db: Session = Depends(get_db)):
    source = db.query(Product).filter_by(slug=payload.source_slug).first() if payload.source_slug else None
    target = db.query(Product).filter_by(slug=payload.target_slug).first()
    if payload.source_slug and not source:
        raise HTTPException(status_code=404, detail="Source product not found")
    if not target:
        raise HTTPException(status_code=404, detail="Target product not found")
    row = db.query(ProductRecommendation).filter_by(source_product_id=source.id if source else None, target_product_id=target.id, placement=payload.placement).first()
    if not row:
        row = ProductRecommendation(source_product_id=source.id if source else None, target_product_id=target.id, placement=payload.placement)
        db.add(row)
    row.rank = payload.rank
    row.reason = payload.reason
    row.active = payload.active
    audit(db, admin, "recommendation_upsert", f"product:{target.slug}", {"source": payload.source_slug, "placement": payload.placement})
    db.commit()
    return {"ok": True, "target": target.slug, "source": payload.source_slug, "placement": payload.placement}


@router.get("/admin/customer-360/{user_id}")
def customer_360(user_id: int, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    orders = db.query(Order).filter_by(user_id=user.id).order_by(Order.created_at.desc()).limit(20).all()
    tickets = db.query(SupportTicket).filter_by(user_id=user.id).order_by(SupportTicket.created_at.desc()).limit(20).all()
    segments = assign_customer_segments(db, user.id)
    db.commit()
    return {
        "customer": {"id": user.id, "phone": user.phone, "name": user.name, "email": user.email, "referral_code": user.referral_code, "blocked": user.blocked},
        "lifetime_revenue": money(sum(order.total for order in orders if order.payment_status in {"paid", "demo_paid"})),
        "order_count": db.query(Order).filter_by(user_id=user.id).count(),
        "wallet_balance": wallet_balance(db, user.id),
        "segments": segments,
        "orders": [{"id": order.order_number, "status": order.status, "payment_status": order.payment_status, "total": money(order.total), "created_at": order.created_at.isoformat() if order.created_at else None} for order in orders],
        "tickets": [serialize_ticket(ticket) for ticket in tickets],
    }


@router.get("/admin/tasks")
def admin_tasks(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    low_stock = db.query(ProductVariant).filter(ProductVariant.inventory <= ProductVariant.low_stock_threshold).count()
    pending_refunds = db.query(func.count()).select_from(SupportTicket).filter(SupportTicket.category == "refund", SupportTicket.status.in_(["open", "in_progress"])).scalar()
    open_support = db.query(SupportTicket).filter(SupportTicket.status.in_(["open", "waiting_customer", "in_progress"])).count()
    recoveries = db.query(AbandonedCartRecovery).filter(AbandonedCartRecovery.status.in_(["open", "reminded"])).count()
    scheduled_blogs = db.query(BlogPost).filter_by(status="scheduled").count()
    return [
        {"key": "low_stock", "label": "Low-stock variants", "count": low_stock, "priority": "high" if low_stock else "normal"},
        {"key": "pending_refunds", "label": "Refund support tickets", "count": int(pending_refunds or 0), "priority": "high" if pending_refunds else "normal"},
        {"key": "open_support", "label": "Open support tickets", "count": open_support, "priority": "high" if open_support else "normal"},
        {"key": "cart_recoveries", "label": "Cart recovery opportunities", "count": recoveries, "priority": "normal"},
        {"key": "scheduled_blogs", "label": "Scheduled blogs", "count": scheduled_blogs, "priority": "normal"},
    ]
