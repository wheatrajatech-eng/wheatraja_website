from datetime import datetime
import uuid as uuid_lib
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TimestampMixin:
    uuid: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid_lib.uuid4()))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)


class User(TimestampMixin, Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(Enum("customer", "admin"), default="customer")
    referral_code: Mapped[str | None] = mapped_column(String(4), unique=True)
    wallet_active: Mapped[bool] = mapped_column(Boolean, default=True)
    blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    admin_notes: Mapped[str | None] = mapped_column(Text)
    profile_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    signup_completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    addresses = relationship("Address", back_populates="user")


class Address(TimestampMixin, Base):
    __tablename__ = "addresses"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    label: Mapped[str] = mapped_column(String(80))
    line1: Mapped[str] = mapped_column(String(240))
    city: Mapped[str] = mapped_column(String(80), default="Noida")
    pincode: Mapped[str] = mapped_column(String(12))
    distance_km: Mapped[float | None] = mapped_column(Float)
    first_order_discount_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    user = relationship("User", back_populates="addresses")


class Product(TimestampMixin, Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    headline: Mapped[str | None] = mapped_column(String(220))
    benefit: Mapped[str | None] = mapped_column(Text)
    ingredients: Mapped[str | None] = mapped_column(Text)
    accent: Mapped[str | None] = mapped_column(String(20))
    nutrition_json: Mapped[str | None] = mapped_column(Text)
    proof_json: Mapped[str | None] = mapped_column(Text)
    best_for_json: Mapped[str | None] = mapped_column(Text)
    comparison_json: Mapped[str | None] = mapped_column(Text)
    storage_json: Mapped[str | None] = mapped_column(Text)
    notes_json: Mapped[str | None] = mapped_column(Text)
    faqs_json: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    seo_title: Mapped[str | None] = mapped_column(String(180))
    seo_description: Mapped[str | None] = mapped_column(String(320))
    hsn_code: Mapped[str | None] = mapped_column(String(20), index=True)
    gst_rate: Mapped[float | None] = mapped_column(Numeric(5, 2))
    variants = relationship("ProductVariant", back_populates="product")
    images = relationship("ProductImage", back_populates="product")


class ProductVariant(TimestampMixin, Base):
    __tablename__ = "product_variants"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    weight_kg: Mapped[int] = mapped_column(Integer)
    sku: Mapped[str | None] = mapped_column(String(120), unique=True)
    mrp: Mapped[float | None] = mapped_column(Numeric(10, 2))
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    discount_percent: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10)
    inventory: Mapped[int] = mapped_column(Integer, default=0)
    product = relationship("Product", back_populates="variants")


class ProductImage(TimestampMixin, Base):
    __tablename__ = "product_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    url: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str] = mapped_column(String(200))
    product = relationship("Product", back_populates="images")


class Cart(TimestampMixin, Base):
    __tablename__ = "carts"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    user = relationship("User")
    cart_items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(TimestampMixin, Base):
    __tablename__ = "cart_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    cart = relationship("Cart", back_populates="cart_items")
    variant = relationship("ProductVariant")


class AbandonedCartRecovery(TimestampMixin, Base):
    __tablename__ = "abandoned_cart_recoveries"
    __table_args__ = (
        Index("ix_abandoned_cart_recoveries_status_updated_at", "status", "updated_at"),
        Index("ix_abandoned_cart_recoveries_user_status", "user_id", "status"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    phone: Mapped[str | None] = mapped_column(String(20), index=True)
    email: Mapped[str | None] = mapped_column(String(180), index=True)
    session_id: Mapped[str | None] = mapped_column(String(120), index=True)
    cart_json: Mapped[str] = mapped_column(Text)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[str] = mapped_column(String(40), default="open", index=True)
    recovery_channel: Mapped[str | None] = mapped_column(String(40))
    last_reminder_at: Mapped[datetime | None] = mapped_column(DateTime)
    checkout_started_at: Mapped[datetime | None] = mapped_column(DateTime)
    converted_order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), index=True)


class Order(TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_status_created_at", "status", "created_at"),
        Index("ix_orders_payment_status_created_at", "payment_status", "created_at"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    address_id: Mapped[int | None] = mapped_column(ForeignKey("addresses.id"))
    status: Mapped[str] = mapped_column(Enum("pending_payment", "placed", "milling", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"), default="pending_payment")
    payment_status: Mapped[str] = mapped_column(String(40), default="pending")
    customer_phone: Mapped[str | None] = mapped_column(String(20))
    delivery_area: Mapped[str | None] = mapped_column(String(120))
    delivery_eta: Mapped[str | None] = mapped_column(String(120))
    address_text: Mapped[str | None] = mapped_column(Text)
    billing_address_text: Mapped[str | None] = mapped_column(Text)
    order_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    source_channel: Mapped[str] = mapped_column(String(60), default="website", index=True)
    source_detail: Mapped[str | None] = mapped_column(String(240))
    campaign_name: Mapped[str | None] = mapped_column(String(160))
    utm_source: Mapped[str | None] = mapped_column(String(120))
    utm_medium: Mapped[str | None] = mapped_column(String(120))
    utm_campaign: Mapped[str | None] = mapped_column(String(160))
    created_by: Mapped[str] = mapped_column(String(60), default="customer")
    admin_owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    admin_notes: Mapped[str | None] = mapped_column(Text)
    customer_notes: Mapped[str | None] = mapped_column(Text)
    expected_delivery_at: Mapped[datetime | None] = mapped_column(DateTime)
    payment_method: Mapped[str | None] = mapped_column(String(60))
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    discount_total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    delivery_charge: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    wallet_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    payable_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2))
    user = relationship("User", foreign_keys="Order.user_id")
    items = relationship("OrderItem", cascade="all, delete-orphan")


class OrderItem(TimestampMixin, Base):
    __tablename__ = "order_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    subscription: Mapped[bool] = mapped_column(Boolean, default=False)
    variant = relationship("ProductVariant")


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_provider_order_id", "provider_order_id"),
        Index("ix_payments_provider_payment_id", "provider_payment_id"),
        Index("ix_payments_status_created_at", "status", "created_at"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    provider: Mapped[str] = mapped_column(String(40), default="razorpay")
    provider_order_id: Mapped[str | None] = mapped_column(String(120))
    provider_payment_id: Mapped[str | None] = mapped_column(String(120))
    provider_signature: Mapped[str | None] = mapped_column(String(240))
    method: Mapped[str | None] = mapped_column(String(60))
    transaction_reference: Mapped[str | None] = mapped_column(String(160), index=True)
    note: Mapped[str | None] = mapped_column(Text)
    proof_url: Mapped[str | None] = mapped_column(String(500))
    received_at: Mapped[datetime | None] = mapped_column(DateTime)
    amount: Mapped[float | None] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(40), default="created")


class PaymentWebhook(TimestampMixin, Base):
    __tablename__ = "payment_webhooks"
    __table_args__ = (Index("ix_payment_webhooks_created_at", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[str] = mapped_column(String(180), unique=True)
    payload_json: Mapped[str | None] = mapped_column(Text)


class EmailAttemptLog(TimestampMixin, Base):
    __tablename__ = "email_attempt_logs"
    __table_args__ = (Index("ix_email_attempt_logs_status_created_at", "status", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str] = mapped_column(String(60), index=True)
    recipient: Mapped[str] = mapped_column(String(180), index=True)
    subject: Mapped[str] = mapped_column(String(240))
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(40), index=True)
    error: Mapped[str | None] = mapped_column(Text)


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True, index=True)
    invoice_number: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    invoice_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(40), default="issued", index=True)
    seller_json: Mapped[str | None] = mapped_column(Text)
    tax_json: Mapped[str | None] = mapped_column(Text)
    order = relationship("Order")


class InvoiceSequence(TimestampMixin, Base):
    __tablename__ = "invoice_sequences"
    id: Mapped[int] = mapped_column(primary_key=True)
    fiscal_year: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    last_number: Mapped[int] = mapped_column(Integer, default=0)


class Coupon(TimestampMixin, Base):
    __tablename__ = "coupons"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    percent_off: Mapped[int] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class CouponUsage(TimestampMixin, Base):
    __tablename__ = "coupon_usage"
    id: Mapped[int] = mapped_column(primary_key=True)
    coupon_id: Mapped[int] = mapped_column(ForeignKey("coupons.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))


class DeliveryRule(TimestampMixin, Base):
    __tablename__ = "delivery_rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    min_km: Mapped[float] = mapped_column(Float)
    max_km: Mapped[float | None] = mapped_column(Float)
    charge: Mapped[float | None] = mapped_column(Numeric(10, 2))
    deliverable: Mapped[bool] = mapped_column(Boolean, default=True)
    admin_override_allowed: Mapped[bool] = mapped_column(Boolean, default=False)


class Subscription(TimestampMixin, Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    cadence: Mapped[str] = mapped_column(String(40), default="30_days")
    discount_percent: Mapped[int] = mapped_column(Integer, default=10)
    next_delivery_at: Mapped[datetime | None] = mapped_column(DateTime)
    wallet_auto_deduct: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(40), default="active")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    variant = relationship("ProductVariant")
    deliveries = relationship("SubscriptionDelivery", back_populates="subscription")


class ReminderSchedule(TimestampMixin, Base):
    __tablename__ = "reminder_schedules"
    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), nullable=True, index=True)
    subscription_id: Mapped[int | None] = mapped_column(ForeignKey("subscriptions.id"), nullable=True, index=True)
    kind: Mapped[str] = mapped_column(String(40), default="reorder", index=True)
    channel: Mapped[str] = mapped_column(String(40), default="in_app")
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    reminder_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    payload_json: Mapped[str | None] = mapped_column(Text)
    user = relationship("User")


class ReminderDeliveryOutbox(TimestampMixin, Base):
    __tablename__ = "reminder_delivery_outbox"
    __table_args__ = (
        UniqueConstraint("reminder_schedule_id", "channel"),
        Index("ix_reminder_delivery_outbox_status_available_at", "status", "available_at"),
        Index("ix_reminder_delivery_outbox_channel_status", "channel", "status"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    reminder_schedule_id: Mapped[int] = mapped_column(ForeignKey("reminder_schedules.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    channel: Mapped[str] = mapped_column(String(40), index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(240))
    body: Mapped[str] = mapped_column(Text)
    payload_json: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    available_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    provider_message_id: Mapped[str | None] = mapped_column(String(160))
    last_error: Mapped[str | None] = mapped_column(Text)
    reminder_schedule = relationship("ReminderSchedule")
    user = relationship("User")


class SubscriptionDelivery(TimestampMixin, Base):
    __tablename__ = "subscription_deliveries"
    __table_args__ = (UniqueConstraint("subscription_id", "scheduled_for"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(ForeignKey("subscriptions.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))
    scheduled_for: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(40), default="scheduled")
    wallet_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    payable_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    note: Mapped[str | None] = mapped_column(String(240))
    subscription = relationship("Subscription", back_populates="deliveries")
    order = relationship("Order")


class WalletTransaction(TimestampMixin, Base):
    __tablename__ = "wallet_transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    points: Mapped[int] = mapped_column(Integer, default=0)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    transaction_type: Mapped[str] = mapped_column(String(60), default="credit")
    reason: Mapped[str] = mapped_column(String(160))
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))


class Referral(TimestampMixin, Base):
    __tablename__ = "referrals"
    __table_args__ = (UniqueConstraint("referrer_id", "referred_user_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    referrer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    referred_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    rewarded: Mapped[bool] = mapped_column(Boolean, default=False)


class Review(TimestampMixin, Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    approved: Mapped[bool] = mapped_column(Boolean, default=False)


class BlogPost(TimestampMixin, Base):
    __tablename__ = "blog_posts"
    __table_args__ = (
        Index("ix_blog_posts_status_published_at", "status", "published_at"),
        Index("ix_blog_posts_featured_pinned", "featured", "pinned_rank"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(60), default="Blog")
    read_time: Mapped[str | None] = mapped_column(String(40))
    cover_image_url: Mapped[str | None] = mapped_column(String(500))
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    seo_title: Mapped[str | None] = mapped_column(String(180))
    seo_description: Mapped[str | None] = mapped_column(String(320))
    author_name: Mapped[str | None] = mapped_column(String(120))
    tags_json: Mapped[str | None] = mapped_column(Text)
    gallery_json: Mapped[str | None] = mapped_column(Text)
    inline_images_json: Mapped[str | None] = mapped_column(Text)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    pinned_rank: Mapped[int] = mapped_column(Integer, default=100, index=True)
    status: Mapped[str] = mapped_column(String(40), default="published", index=True)
    scheduled_publish_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    content_format: Mapped[str] = mapped_column(String(40), default="markdown")
    meta_keywords: Mapped[str | None] = mapped_column(String(300))


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    channel: Mapped[str] = mapped_column(String(40), default="in_app")
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(String(500))
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class ContactInquiry(TimestampMixin, Base):
    __tablename__ = "contact_inquiries"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="new")


class AdminAuditLog(TimestampMixin, Base):
    __tablename__ = "admin_audit_logs"
    __table_args__ = (
        Index("ix_admin_audit_logs_admin_created_at", "admin_id", "created_at"),
        Index("ix_admin_audit_logs_action_created_at", "action", "created_at"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(160))
    entity: Mapped[str] = mapped_column(String(120))
    metadata_json: Mapped[str | None] = mapped_column(Text)


class Setting(TimestampMixin, Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True)
    value: Mapped[str] = mapped_column(Text)


class Role(TimestampMixin, Base):
    __tablename__ = "roles"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(240))


class Permission(TimestampMixin, Base):
    __tablename__ = "permissions"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(240))


class RolePermission(TimestampMixin, Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "permission_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id"))


class UserRole(TimestampMixin, Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))


class Session(TimestampMixin, Base):
    __tablename__ = "sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(160), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)


class RefreshToken(TimestampMixin, Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(160), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)


class OtpCode(TimestampMixin, Base):
    __tablename__ = "otp_codes"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code_hash: Mapped[str] = mapped_column(String(160))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime)


class LoginHistory(TimestampMixin, Base):
    __tablename__ = "login_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    phone: Mapped[str] = mapped_column(String(20), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(80))
    user_agent: Mapped[str | None] = mapped_column(String(300))
    success: Mapped[bool] = mapped_column(Boolean, default=False)


class Category(TimestampMixin, Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class ProductFeature(TimestampMixin, Base):
    __tablename__ = "product_features"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    label: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(300))


class ProductSpecification(TimestampMixin, Base):
    __tablename__ = "product_specifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    name: Mapped[str] = mapped_column(String(160))
    value: Mapped[str] = mapped_column(String(300))


class ProductNutrition(TimestampMixin, Base):
    __tablename__ = "product_nutrition"
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    nutrient: Mapped[str] = mapped_column(String(120))
    value: Mapped[str] = mapped_column(String(120))


class ProductReviewImage(TimestampMixin, Base):
    __tablename__ = "product_review_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id"))
    url: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str | None] = mapped_column(String(200))


class Inventory(TimestampMixin, Base):
    __tablename__ = "inventory"
    id: Mapped[int] = mapped_column(primary_key=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"), unique=True)
    available: Mapped[int] = mapped_column(Integer, default=0)
    reserved: Mapped[int] = mapped_column(Integer, default=0)
    variant = relationship("ProductVariant")


class InventoryReservation(TimestampMixin, Base):
    __tablename__ = "inventory_reservations"
    __table_args__ = (
        UniqueConstraint("order_id", "variant_id"),
        Index("ix_inventory_reservations_status_expires_at", "status", "expires_at"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(40), default="reserved", index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime)
    released_at: Mapped[datetime | None] = mapped_column(DateTime)
    variant = relationship("ProductVariant")


class StockMovement(TimestampMixin, Base):
    __tablename__ = "stock_movements"
    __table_args__ = (Index("ix_stock_movements_variant_created_at", "variant_id", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    movement_type: Mapped[str] = mapped_column(Enum("in", "out", "reserve", "release", "adjustment"))
    reason: Mapped[str] = mapped_column(String(180))


class PaymentTransaction(TimestampMixin, Base):
    __tablename__ = "payment_transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"))
    transaction_id: Mapped[str] = mapped_column(String(160), unique=True)
    status: Mapped[str] = mapped_column(String(60))
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    payload_json: Mapped[str | None] = mapped_column(Text)


class Refund(TimestampMixin, Base):
    __tablename__ = "refunds"
    __table_args__ = (Index("ix_refunds_status_created_at", "status", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"))
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(60), default="requested")
    reason: Mapped[str | None] = mapped_column(String(240))
    provider_refund_id: Mapped[str | None] = mapped_column(String(160), index=True)
    payload_json: Mapped[str | None] = mapped_column(Text)


class ReturnRequest(TimestampMixin, Base):
    __tablename__ = "returns"
    __table_args__ = (Index("ix_returns_status_created_at", "status", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reason: Mapped[str] = mapped_column(String(240))
    status: Mapped[str] = mapped_column(String(60), default="requested", index=True)
    resolution_note: Mapped[str | None] = mapped_column(Text)


class ReturnItem(TimestampMixin, Base):
    __tablename__ = "return_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    return_id: Mapped[int] = mapped_column(ForeignKey("returns.id"), index=True)
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id"))
    quantity: Mapped[int] = mapped_column(Integer)
    condition: Mapped[str | None] = mapped_column(String(120))


class Wishlist(TimestampMixin, Base):
    __tablename__ = "wishlists"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))


class Wallet(TimestampMixin, Base):
    __tablename__ = "wallet"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    balance_points: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class ReferralReward(TimestampMixin, Base):
    __tablename__ = "referral_rewards"
    id: Mapped[int] = mapped_column(primary_key=True)
    referral_id: Mapped[int] = mapped_column(ForeignKey("referrals.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    points: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(60), default="pending")


class LoyaltyTier(TimestampMixin, Base):
    __tablename__ = "loyalty_tiers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    min_points: Mapped[int] = mapped_column(Integer, default=0, index=True)
    reward_multiplier: Mapped[float] = mapped_column(Numeric(5, 2), default=1)
    perks_json: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class CustomerSegment(TimestampMixin, Base):
    __tablename__ = "customer_segments"
    __table_args__ = (UniqueConstraint("user_id", "segment"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    segment: Mapped[str] = mapped_column(String(80), index=True)
    reason_json: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class SupportTicket(TimestampMixin, Base):
    __tablename__ = "support_tickets"
    __table_args__ = (
        Index("ix_support_tickets_status_created_at", "status", "created_at"),
        Index("ix_support_tickets_user_status", "user_id", "status"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"), index=True)
    category: Mapped[str] = mapped_column(String(60), default="general", index=True)
    subject: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="open", index=True)
    priority: Mapped[str] = mapped_column(String(40), default="normal")
    resolution_note: Mapped[str | None] = mapped_column(Text)
    assigned_admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class DeliverySlot(TimestampMixin, Base):
    __tablename__ = "delivery_slots"
    __table_args__ = (Index("ix_delivery_slots_zone_start", "zone", "starts_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    zone: Mapped[str] = mapped_column(String(120), default="Noida Core", index=True)
    pincode: Mapped[str | None] = mapped_column(String(12), index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    capacity: Mapped[int] = mapped_column(Integer, default=25)
    booked_count: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class ProductRecommendation(TimestampMixin, Base):
    __tablename__ = "product_recommendations"
    __table_args__ = (
        UniqueConstraint("source_product_id", "target_product_id", "placement"),
        Index("ix_product_recommendations_source_placement", "source_product_id", "placement"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    source_product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id"), index=True)
    target_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    placement: Mapped[str] = mapped_column(String(80), default="similar", index=True)
    rank: Mapped[int] = mapped_column(Integer, default=100)
    reason: Mapped[str | None] = mapped_column(String(240))
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class BlogProductLink(TimestampMixin, Base):
    __tablename__ = "blog_product_links"
    __table_args__ = (UniqueConstraint("blog_post_id", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    blog_post_id: Mapped[int] = mapped_column(ForeignKey("blog_posts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    rank: Mapped[int] = mapped_column(Integer, default=100)
    cta_text: Mapped[str | None] = mapped_column(String(80))


class BlogCategory(TimestampMixin, Base):
    __tablename__ = "blog_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(160))


class NewsletterSubscriber(TimestampMixin, Base):
    __tablename__ = "newsletter_subscribers"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(180), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Offer(TimestampMixin, Base):
    __tablename__ = "offers"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(String(300))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Banner(TimestampMixin, Base):
    __tablename__ = "banners"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    subtitle: Mapped[str | None] = mapped_column(String(260))
    image_url: Mapped[str | None] = mapped_column(String(500))
    cta_text: Mapped[str | None] = mapped_column(String(80))
    link_url: Mapped[str | None] = mapped_column(String(500))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class DeliveryZone(TimestampMixin, Base):
    __tablename__ = "delivery_zones"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class DeliveryCharge(TimestampMixin, Base):
    __tablename__ = "delivery_charges"
    id: Mapped[int] = mapped_column(primary_key=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("delivery_zones.id"))
    min_km: Mapped[float] = mapped_column(Float)
    max_km: Mapped[float | None] = mapped_column(Float)
    charge: Mapped[float | None] = mapped_column(Numeric(10, 2))


class Pincode(TimestampMixin, Base):
    __tablename__ = "pincodes"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("delivery_zones.id"))
    distance_km: Mapped[float | None] = mapped_column(Float)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class SystemConfig(TimestampMixin, Base):
    __tablename__ = "system_configs"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(120), unique=True)
    value: Mapped[str] = mapped_column(Text)


class MediaLibrary(TimestampMixin, Base):
    __tablename__ = "media_library"
    id: Mapped[int] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column(String(500))
    file_name: Mapped[str] = mapped_column(String(240))
    mime_type: Mapped[str] = mapped_column(String(120))
    size_bytes: Mapped[int | None] = mapped_column(Integer)


class PageView(TimestampMixin, Base):
    __tablename__ = "page_views"
    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(String(500), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    session_id: Mapped[str | None] = mapped_column(String(120), index=True)


class Event(TimestampMixin, Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_name: Mapped[str] = mapped_column(String(160), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    payload_json: Mapped[str | None] = mapped_column(Text)


class SearchLog(TimestampMixin, Base):
    __tablename__ = "search_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    query: Mapped[str] = mapped_column(String(240), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    result_count: Mapped[int] = mapped_column(Integer, default=0)


class Shipment(TimestampMixin, Base):
    __tablename__ = "shipments"
    __table_args__ = (Index("ix_shipments_status_created_at", "status", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    provider: Mapped[str | None] = mapped_column(String(120))
    tracking_number: Mapped[str | None] = mapped_column(String(160), index=True)
    status: Mapped[str] = mapped_column(String(60), default="pending")
    estimated_delivery_at: Mapped[datetime | None] = mapped_column(DateTime)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime)


class ShipmentEvent(TimestampMixin, Base):
    __tablename__ = "shipment_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    shipment_id: Mapped[int] = mapped_column(ForeignKey("shipments.id"), index=True)
    status: Mapped[str] = mapped_column(String(80), index=True)
    location: Mapped[str | None] = mapped_column(String(160))
    note: Mapped[str | None] = mapped_column(String(300))
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class NotificationEvent(TimestampMixin, Base):
    __tablename__ = "notification_events"
    __table_args__ = (Index("ix_notification_events_status_created_at", "status", "created_at"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    channel: Mapped[str] = mapped_column(String(40), default="in_app")
    status: Mapped[str] = mapped_column(String(40), default="queued", index=True)
    payload_json: Mapped[str | None] = mapped_column(Text)


class Blog(TimestampMixin, Base):
    __tablename__ = "blogs"
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("blog_categories.id"))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str | None] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String(500))
    published: Mapped[bool] = mapped_column(Boolean, default=True)


class Contact(TimestampMixin, Base):
    __tablename__ = "contacts"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(String(180))
    phone: Mapped[str | None] = mapped_column(String(20))
    subject: Mapped[str | None] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="new")


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(160))
    entity: Mapped[str] = mapped_column(String(120))
    entity_id: Mapped[str | None] = mapped_column(String(80))
    metadata_json: Mapped[str | None] = mapped_column(Text)
