import csv
import io
import json
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin, require_admin_permission
from app.core.config import settings
from app.core.database import get_db
from app.models.entities import AbandonedCartRecovery, AdminAuditLog, Banner, BlogPost, Contact, ContactInquiry, Coupon, CustomerSegment, DeliverySlot, Inventory, LoyaltyTier, NotificationEvent, Order, OrderItem, Payment, Permission, Product, ProductVariant, Refund, Referral, ReturnRequest, Review, Role, RolePermission, Shipment, Subscription, SubscriptionDelivery, SupportTicket, User, UserRole, WalletTransaction
from app.services.store import get_or_create_user, money, serialize_product, wallet_balance
from app.api.orders import serialize_order
from app.services.readiness import launch_readiness_checks

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminAction(BaseModel):
    action: str
    entity: str = "system"


class WalletAdjustIn(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    amount: int
    reason: str = Field(min_length=3, max_length=160)


class RoleIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=240)


class PermissionIn(BaseModel):
    key: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=240)


class RolePermissionIn(BaseModel):
    role_id: int
    permission_id: int


class ProductBulkIn(BaseModel):
    ids: list[int] = Field(default_factory=list)
    slugs: list[str] = Field(default_factory=list)
    action: str = Field(pattern="^(publish|archive|delete|feature|unfeature|category)$")
    category_id: int | None = None


class OrderBulkStatusIn(BaseModel):
    order_ids: list[str] = Field(min_length=1)
    status: str


def write_audit(db: Session, admin: dict, action: str, entity: str):
    user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=user.id, action=action, entity=entity, metadata_json="{}"))
    db.commit()


def build_summary(db: Session) -> dict:
    revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(Order.payment_status.in_(["paid", "demo_paid"])).scalar()
    orders = db.query(Order).count()
    customers = db.query(User).filter(User.role == "customer").count()
    subscriptions = db.query(Subscription).filter_by(active=True).count()
    total_products = db.query(Product).filter_by(active=True).count()
    pending_orders = db.query(Order).filter(Order.status.in_(["placed", "milling", "packed", "out_for_delivery"])).count()
    low_stock_products = db.query(Inventory).filter(Inventory.available <= 10).count()
    new_contact_leads = db.query(Contact).filter_by(status="new").count() + db.query(ContactInquiry).filter_by(status="new").count()
    wallet_liability = db.query(func.coalesce(func.sum(WalletTransaction.amount), 0)).scalar()
    subscription_due = db.query(Subscription).filter(Subscription.status.in_(["active", "payment_due"])).count()
    recent_orders = db.query(Order).order_by(Order.created_at.desc()).limit(8).all()
    product_mix = []
    for product in db.query(Product).all():
        count = (
            db.query(func.coalesce(func.sum(OrderItem.quantity), 0))
            .join(ProductVariant, OrderItem.variant_id == ProductVariant.id)
            .filter(ProductVariant.product_id == product.id)
            .scalar()
        )
        product_mix.append({"name": product.name, "count": int(count or 0)})
    source_mix = [
        {"source": source or "unknown", "orders": int(count or 0), "revenue": money(revenue or 0)}
        for source, count, revenue in db.query(Order.source_channel, func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).group_by(Order.source_channel).all()
    ]
    return {
        "metrics": {
            "revenue": money(revenue),
            "orders": orders,
            "customers": customers,
            "subscriptions": subscriptions,
            "total_products": total_products,
            "total_orders": orders,
            "total_revenue": money(revenue),
            "pending_orders": pending_orders,
            "low_stock_products": low_stock_products,
            "new_contact_leads": new_contact_leads,
            "wallet_liability": money(wallet_liability),
            "subscription_due": subscription_due
        },
        "recent_orders": [serialize_order(order) for order in recent_orders],
        "product_mix": product_mix,
        "source_mix": source_mix
    }


@router.get("/stats")
def stats(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return build_summary(db)


@router.get("/summary")
def summary(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return build_summary(db)


@router.get("/orders")
def orders(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [serialize_order(order) for order in db.query(Order).order_by(Order.created_at.desc()).limit(200).all()]


@router.get("/products")
def products(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [serialize_product(product) for product in db.query(Product).all()]


@router.get("/customers")
def customers(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = []
    for row in db.query(User).order_by(User.created_at.desc()).limit(200).all():
        order_count = db.query(Order).filter_by(user_id=row.id).count()
        revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(Order.user_id == row.id, Order.payment_status.in_(["paid", "demo_paid"])).scalar()
        segments = [segment.segment for segment in db.query(CustomerSegment).filter_by(user_id=row.id, active=True).all()]
        rows.append({"id": row.id, "phone": row.phone, "name": row.name, "email": row.email, "role": row.role, "blocked": row.blocked, "admin_notes": row.admin_notes, "referral_code": row.referral_code, "orders": order_count, "lifetime_revenue": money(revenue), "wallet_balance": wallet_balance(db, row.id), "segments": ", ".join(segments)})
    return rows


@router.get("/coupons")
def coupons(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "code": row.code, "percent_off": row.percent_off, "active": row.active} for row in db.query(Coupon).all()]


@router.get("/subscriptions")
def subscriptions(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "product": row.variant.product.name,
            "weight_kg": row.variant.weight_kg,
            "quantity": row.quantity,
            "cadence": row.cadence,
            "status": row.status,
            "active": row.active,
            "wallet_auto_deduct": row.wallet_auto_deduct,
            "next_delivery_at": row.next_delivery_at.isoformat() if row.next_delivery_at else None,
            "scheduled": db.query(SubscriptionDelivery).filter_by(subscription_id=row.id, status="scheduled").count(),
            "payment_due": db.query(SubscriptionDelivery).filter_by(subscription_id=row.id, status="payment_due").count(),
        }
        for row in db.query(Subscription).order_by(Subscription.created_at.desc()).limit(200).all()
    ]


@router.get("/payments")
def payments(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(Payment).order_by(Payment.created_at.desc()).limit(200).all()
    orders = {row.id: row.order_number for row in db.query(Order).filter(Order.id.in_([payment.order_id for payment in rows] or [0])).all()}
    return [
        {
            "id": row.id,
            "order_id": orders.get(row.order_id),
            "provider": row.provider,
            "provider_order_id": row.provider_order_id,
            "provider_payment_id": row.provider_payment_id,
            "amount": money(row.amount),
            "status": row.status,
            "method": row.method,
            "transaction_reference": row.transaction_reference,
            "note": row.note,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.get("/refunds")
def refunds(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(Refund).order_by(Refund.created_at.desc()).limit(200).all()
    payments_by_id = {row.id: row for row in db.query(Payment).filter(Payment.id.in_([refund.payment_id for refund in rows] or [0])).all()}
    order_ids = [payment.order_id for payment in payments_by_id.values()]
    orders = {row.id: row.order_number for row in db.query(Order).filter(Order.id.in_(order_ids or [0])).all()}
    return [
        {
            "id": row.id,
            "payment_id": row.payment_id,
            "order_id": orders.get(payments_by_id[row.payment_id].order_id) if row.payment_id in payments_by_id else None,
            "amount": money(row.amount),
            "status": row.status,
            "reason": row.reason,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.get("/returns")
def returns(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(ReturnRequest).order_by(ReturnRequest.created_at.desc()).limit(200).all()
    orders = {row.id: row.order_number for row in db.query(Order).filter(Order.id.in_([item.order_id for item in rows] or [0])).all()}
    users = {row.id: row.phone for row in db.query(User).filter(User.id.in_([item.user_id for item in rows] or [0])).all()}
    return [
        {
            "id": row.id,
            "order_id": orders.get(row.order_id),
            "customer": users.get(row.user_id),
            "reason": row.reason,
            "status": row.status,
            "resolution_note": row.resolution_note,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.get("/shipments")
def shipments(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(Shipment).order_by(Shipment.created_at.desc()).limit(200).all()
    orders = {row.id: row.order_number for row in db.query(Order).filter(Order.id.in_([shipment.order_id for shipment in rows] or [0])).all()}
    return [
        {
            "id": row.id,
            "order_id": orders.get(row.order_id),
            "provider": row.provider,
            "tracking_number": row.tracking_number,
            "status": row.status,
            "estimated_delivery_at": row.estimated_delivery_at.isoformat() if row.estimated_delivery_at else None,
            "delivered_at": row.delivered_at.isoformat() if row.delivered_at else None,
        }
        for row in rows
    ]


@router.get("/notification-events")
def notification_events(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(NotificationEvent).order_by(NotificationEvent.created_at.desc()).limit(200).all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "event_type": row.event_type,
            "channel": row.channel,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.get("/support")
def support(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "ticket_number": row.ticket_number,
            "user_id": row.user_id,
            "order_id": row.order_id,
            "category": row.category,
            "subject": row.subject,
            "status": row.status,
            "priority": row.priority,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).limit(200).all()
    ]


@router.get("/recoveries")
def recoveries(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "phone": row.phone,
            "email": row.email,
            "subtotal": money(row.subtotal),
            "status": row.status,
            "recovery_channel": row.recovery_channel,
            "checkout_started_at": row.checkout_started_at.isoformat() if row.checkout_started_at else None,
            "last_reminder_at": row.last_reminder_at.isoformat() if row.last_reminder_at else None,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }
        for row in db.query(AbandonedCartRecovery).order_by(AbandonedCartRecovery.updated_at.desc()).limit(200).all()
    ]


@router.get("/delivery-slots")
def delivery_slots(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "zone": row.zone,
            "pincode": row.pincode,
            "starts_at": row.starts_at.isoformat() if row.starts_at else None,
            "ends_at": row.ends_at.isoformat() if row.ends_at else None,
            "capacity": row.capacity,
            "booked_count": row.booked_count,
            "active": row.active,
        }
        for row in db.query(DeliverySlot).order_by(DeliverySlot.starts_at.asc()).limit(200).all()
    ]


@router.get("/loyalty")
def loyalty(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "name": row.name,
            "min_points": row.min_points,
            "reward_multiplier": money(row.reward_multiplier),
            "active": row.active,
        }
        for row in db.query(LoyaltyTier).order_by(LoyaltyTier.min_points.asc()).all()
    ]


@router.get("/wallet")
def wallet(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "user_id": row.user_id, "amount": money(row.amount), "transaction_type": row.transaction_type, "reason": row.reason, "created_at": row.created_at.isoformat()} for row in db.query(WalletTransaction).order_by(WalletTransaction.created_at.desc()).limit(200).all()]


@router.get("/banners")
def banners(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "title": row.title, "subtitle": row.subtitle, "image_url": row.image_url, "cta_text": row.cta_text, "link_url": row.link_url, "display_order": row.display_order, "active": row.active, "starts_at": row.starts_at.isoformat() if row.starts_at else None, "ends_at": row.ends_at.isoformat() if row.ends_at else None, "created_at": row.created_at.isoformat()} for row in db.query(Banner).order_by(Banner.display_order.asc(), Banner.created_at.desc()).limit(200).all()]


@router.get("/blogs")
def blogs(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [
        {
            "id": row.id,
            "slug": row.slug,
            "title": row.title,
            "excerpt": row.excerpt,
            "category": row.category,
            "published": row.status == "published",
            "status": row.status,
            "featured": row.featured,
            "pinned_rank": row.pinned_rank,
            "author_name": row.author_name,
            "read_time": row.read_time,
            "cover_image_url": row.cover_image_url,
            "seo_title": row.seo_title,
            "seo_description": row.seo_description,
            "published_at": row.published_at.isoformat() if row.published_at else None,
            "scheduled_publish_at": row.scheduled_publish_at.isoformat() if row.scheduled_publish_at else None,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in db.query(BlogPost).order_by(BlogPost.created_at.desc()).limit(200).all()
    ]


@router.get("/reviews")
def reviews(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "rating": row.rating, "comment": row.comment, "approved": row.approved} for row in db.query(Review).order_by(Review.created_at.desc()).limit(200).all()]


@router.get("/contact")
def contact(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    contact_rows = [{"id": row.id, "source": "contact", "name": row.name, "phone": row.phone, "message": row.message, "status": row.status} for row in db.query(Contact).order_by(Contact.created_at.desc()).limit(100).all()]
    inquiry_rows = [{"id": row.id, "source": "inquiry", "name": row.name, "phone": row.phone, "message": row.message, "status": row.status} for row in db.query(ContactInquiry).order_by(ContactInquiry.created_at.desc()).limit(100).all()]
    return contact_rows + inquiry_rows


@router.patch("/contact/{source}/{contact_id}")
def update_contact(source: str, contact_id: int, status: str, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("users.write"))):
    if status not in {"new", "in_progress", "resolved", "closed", "spam"}:
        raise HTTPException(status_code=422, detail="Invalid contact status")
    if source == "contact":
        row = db.query(Contact).filter_by(id=contact_id).first()
    elif source == "inquiry":
        row = db.query(ContactInquiry).filter_by(id=contact_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid contact source")
    if not row:
        raise HTTPException(status_code=404, detail="Contact record not found")
    row.status = status
    write_audit(db, admin, "contact_status", f"{source}:{contact_id}")
    return {"id": contact_id, "source": source, "status": status}


@router.delete("/contact/{source}/{contact_id}")
def delete_contact(source: str, contact_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("users.write"))):
    model = {"contact": Contact, "inquiry": ContactInquiry}.get(source)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid contact source")
    row = db.query(model).filter_by(id=contact_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    if row.status not in {"closed", "spam"}:
        raise HTTPException(status_code=409, detail="Close or mark as spam before deleting")
    db.delete(row)
    write_audit(db, admin, "contact_delete", f"{source}:{contact_id}")
    return {"deleted": True}


@router.get("/audit")
def audit(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "admin_id": row.admin_id, "action": row.action, "entity": row.entity, "created_at": row.created_at.isoformat()} for row in db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(100).all()]


@router.get("/referrals")
def referrals(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(Referral).order_by(Referral.created_at.desc()).limit(200).all()
    users = {row.id: row for row in db.query(User).all()}
    return [
        {
            "id": row.id,
            "referrer_phone": users.get(row.referrer_id).phone if users.get(row.referrer_id) else None,
            "referred_phone": users.get(row.referred_user_id).phone if users.get(row.referred_user_id) else None,
            "rewarded": row.rewarded,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.post("/referrals/{referral_id}/reward")
def reward_referral(referral_id: int, admin: dict = Depends(require_admin_permission("referrals.write")), db: Session = Depends(get_db)):
    referral = db.query(Referral).filter_by(id=referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    if referral.rewarded:
        return {"rewarded": True, "duplicate": True}
    referral.rewarded = True
    db.add(WalletTransaction(user_id=referral.referrer_id, amount=100, transaction_type="credit", reason="referral_reward"))
    db.add(WalletTransaction(user_id=referral.referred_user_id, amount=100, transaction_type="credit", reason="referral_reward"))
    write_audit(db, admin, "referral_reward", f"referral:{referral.id}")
    return {"rewarded": True, "amount": 100}


@router.get("/roles")
def roles(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    return [{"id": row.id, "name": row.name, "description": row.description, "created_at": row.created_at.isoformat() if row.created_at else None} for row in db.query(Role).order_by(Role.name.asc()).all()]


@router.post("/roles")
def create_role(payload: RoleIn, admin: dict = Depends(require_admin_permission("rbac.write")), db: Session = Depends(get_db)):
    role = db.query(Role).filter_by(name=payload.name).first()
    if not role:
        role = Role(name=payload.name, description=payload.description)
        db.add(role)
    else:
        role.description = payload.description
    write_audit(db, admin, "role_upsert", f"role:{payload.name}")
    db.refresh(role)
    return {"id": role.id, "name": role.name, "description": role.description}


@router.get("/permissions")
def permissions(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    rows = db.query(Permission).order_by(Permission.key.asc()).all()
    return [{"id": row.id, "key": row.key, "description": row.description} for row in rows]


@router.post("/permissions")
def create_permission(payload: PermissionIn, admin: dict = Depends(require_admin_permission("rbac.write")), db: Session = Depends(get_db)):
    permission = db.query(Permission).filter_by(key=payload.key).first()
    if not permission:
        permission = Permission(key=payload.key, description=payload.description)
        db.add(permission)
    else:
        permission.description = payload.description
    write_audit(db, admin, "permission_upsert", f"permission:{payload.key}")
    db.refresh(permission)
    return {"id": permission.id, "key": permission.key, "description": permission.description}


@router.post("/role-permissions")
def assign_permission(payload: RolePermissionIn, admin: dict = Depends(require_admin_permission("rbac.write")), db: Session = Depends(get_db)):
    if not db.query(Role).filter_by(id=payload.role_id).first() or not db.query(Permission).filter_by(id=payload.permission_id).first():
        raise HTTPException(status_code=404, detail="Role or permission not found")
    link = db.query(RolePermission).filter_by(role_id=payload.role_id, permission_id=payload.permission_id).first()
    if not link:
        db.add(RolePermission(role_id=payload.role_id, permission_id=payload.permission_id))
    write_audit(db, admin, "role_permission_assign", f"role:{payload.role_id}")
    return {"ok": True, "role_id": payload.role_id, "permission_id": payload.permission_id}


@router.get("/analytics")
def analytics(db: Session = Depends(get_db), admin: dict = Depends(require_admin)):
    paid_orders = db.query(Order).filter(Order.payment_status.in_(["paid", "demo_paid"])).all()
    subscription_orders = db.query(OrderItem).filter_by(subscription=True).count()
    payment_due = db.query(Order).filter_by(payment_status="payment_due").count()
    deliveries = db.query(SubscriptionDelivery).all()
    total_orders = db.query(Order).count()
    recoveries_total = db.query(AbandonedCartRecovery).count()
    recoveries_converted = db.query(AbandonedCartRecovery).filter_by(status="converted").count()
    customers = db.query(User).filter_by(role="customer").count()
    repeat_customers = (
        db.query(Order.user_id)
        .filter(Order.payment_status.in_(["paid", "demo_paid"]))
        .group_by(Order.user_id)
        .having(func.count(Order.id) >= 2)
        .count()
    )
    refund_count = db.query(Refund).count()
    coupon_discount = db.query(func.coalesce(func.sum(Order.discount_total), 0)).scalar()
    source_rows = []
    for source, count, revenue in db.query(Order.source_channel, func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).group_by(Order.source_channel).all():
        cod_count = db.query(Order).filter(Order.source_channel == source, Order.payment_method == "cod").count()
        source_rows.append({"source": source, "orders": count, "revenue": money(revenue), "cod_orders": cod_count})
    product_rows = []
    for product in db.query(Product).all():
        quantity = (
            db.query(func.coalesce(func.sum(OrderItem.quantity), 0))
            .join(ProductVariant, OrderItem.variant_id == ProductVariant.id)
            .filter(ProductVariant.product_id == product.id)
            .scalar()
        )
        product_rows.append({"product": product.name, "quantity": int(quantity or 0)})
    return {
        "revenue": money(sum(money(order.total) for order in paid_orders)),
        "paid_orders": len(paid_orders),
        "total_orders": total_orders,
        "conversion_rate": round((len(paid_orders) / total_orders) * 100, 2) if total_orders else 0,
        "average_order_value": round(sum(money(order.total) for order in paid_orders) / len(paid_orders), 2) if paid_orders else 0,
        "repeat_purchase_rate": round((repeat_customers / customers) * 100, 2) if customers else 0,
        "abandoned_cart_rate": round(((recoveries_total - recoveries_converted) / recoveries_total) * 100, 2) if recoveries_total else 0,
        "cart_recovery_rate": round((recoveries_converted / recoveries_total) * 100, 2) if recoveries_total else 0,
        "refund_rate": round((refund_count / total_orders) * 100, 2) if total_orders else 0,
        "coupon_discount_total": money(coupon_discount),
        "payment_due_orders": payment_due,
        "subscription_order_items": subscription_orders,
        "wallet_liability": money(db.query(func.coalesce(func.sum(WalletTransaction.amount), 0)).scalar()),
        "scheduled_subscription_deliveries": len([row for row in deliveries if row.status == "scheduled"]),
        "payment_due_subscription_deliveries": len([row for row in deliveries if row.status == "payment_due"]),
        "orders_by_source": source_rows,
        "product_performance": sorted(product_rows, key=lambda row: row["quantity"], reverse=True),
    }


@router.get("/readiness")
def readiness(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    checks = launch_readiness_checks(db)
    return {"environment": settings.environment, "market_ready": all(row["ok"] for row in checks if row.get("blocker", True)), "checks": checks}


@router.post("/actions")
def action(payload: AdminAction, admin: dict = Depends(require_admin_permission("settings:write")), db: Session = Depends(get_db)):
    write_audit(db, admin, payload.action, payload.entity)
    return {"ok": True, "action": payload.action, "entity": payload.entity}


@router.post("/wallet-adjust")
def adjust_wallet(payload: WalletAdjustIn = Body(...), admin: dict = Depends(require_admin_permission("wallet.adjust")), db: Session = Depends(get_db)):
    record = get_or_create_user(db, payload.phone, "customer")
    db.add(WalletTransaction(user_id=record.id, amount=payload.amount, transaction_type="admin_adjustment", reason=payload.reason))
    write_audit(db, admin, "wallet_adjust", f"user:{record.id}")
    return {"phone": record.phone, "balance": wallet_balance(db, record.id)}


def csv_response(filename: str, rows: list[dict]) -> Response:
    output = io.StringIO()
    fieldnames = sorted({key for row in rows for key in row.keys()}) if rows else ["empty"]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/{entity}")
def export_entity(entity: str, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("exports.read"))):
    if entity == "products":
        rows = [
            {
                "id": row.id,
                "slug": row.slug,
                "name": row.name,
                "active": row.active,
                "featured": row.featured,
                "category_id": row.category_id,
                "hsn_code": row.hsn_code,
                "gst_rate": money(row.gst_rate) if row.gst_rate is not None else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in db.query(Product).order_by(Product.id.asc()).all()
        ]
    elif entity == "orders":
        rows = [
            {
                "order_number": row.order_number,
                "phone": row.customer_phone,
                "status": row.status,
                "payment_status": row.payment_status,
                "source_channel": row.source_channel,
                "payment_method": row.payment_method,
                "total": money(row.total),
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in db.query(Order).order_by(Order.created_at.desc()).all()
        ]
    elif entity == "customers":
        rows = [
            {
                "id": row.id,
                "phone": row.phone,
                "name": row.name,
                "email": row.email,
                "role": row.role,
                "blocked": row.blocked,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in db.query(User).order_by(User.created_at.desc()).all()
        ]
    elif entity == "payments":
        rows = [
            {
                "id": row.id,
                "order_id": row.order_id,
                "provider": row.provider,
                "method": row.method,
                "amount": money(row.amount),
                "status": row.status,
                "transaction_reference": row.transaction_reference,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in db.query(Payment).order_by(Payment.created_at.desc()).all()
        ]
    elif entity == "inventory":
        rows = [
            {
                "variant_id": row.variant_id,
                "product": row.variant.product.name if row.variant and row.variant.product else None,
                "sku": row.variant.sku if row.variant else None,
                "available": row.available,
                "reserved": row.reserved,
            }
            for row in db.query(Inventory).order_by(Inventory.variant_id.asc()).all()
        ]
    elif entity == "source-report":
        rows = [
            {"source": source or "unknown", "orders": int(count or 0), "revenue": money(revenue or 0)}
            for source, count, revenue in db.query(Order.source_channel, func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).group_by(Order.source_channel).all()
        ]
    else:
        raise HTTPException(status_code=404, detail="Unsupported export entity")
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="export", entity=entity, metadata_json=json.dumps({"rows": len(rows)})))
    db.commit()
    return csv_response(f"{entity}.csv", rows)


@router.post("/bulk/products")
def bulk_products(payload: ProductBulkIn, admin: dict = Depends(require_admin_permission("products.write")), db: Session = Depends(get_db)):
    query = db.query(Product)
    filters = []
    if payload.ids:
        filters.append(Product.id.in_(payload.ids))
    if payload.slugs:
        filters.append(Product.slug.in_(payload.slugs))
    if not filters:
        raise HTTPException(status_code=400, detail="Provide product ids or slugs")
    products_query = query.filter(filters[0]) if len(filters) == 1 else query.filter(filters[0] | filters[1])
    products = products_query.all()
    for product in products:
        if payload.action == "publish":
            product.active = True
        elif payload.action in {"archive", "delete"}:
            product.active = False
        elif payload.action == "feature":
            product.featured = True
        elif payload.action == "unfeature":
            product.featured = False
        elif payload.action == "category":
            product.category_id = payload.category_id
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action=f"bulk_product_{payload.action}", entity="products", metadata_json=json.dumps({"count": len(products)})))
    db.commit()
    return {"updated": len(products), "action": payload.action}


@router.post("/bulk/orders/status")
def bulk_order_status(payload: OrderBulkStatusIn, admin: dict = Depends(require_admin_permission("orders.write")), db: Session = Depends(get_db)):
    allowed = {"pending_payment", "placed", "milling", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"}
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")
    orders = db.query(Order).filter(Order.order_number.in_(payload.order_ids)).all()
    for order in orders:
        order.status = payload.status
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="bulk_order_status", entity="orders", metadata_json=json.dumps({"count": len(orders), "status": payload.status})))
    db.commit()
    return {"updated": len(orders), "status": payload.status}
