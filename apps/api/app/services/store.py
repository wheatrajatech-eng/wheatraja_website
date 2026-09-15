import json
import random
import string
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.entities import (
    Banner,
    BlogPost,
    Category,
    DeliveryCharge,
    DeliveryRule,
    DeliveryZone,
    Inventory,
    LoyaltyTier,
    Permission,
    Pincode,
    Product,
    ProductImage,
    ProductVariant,
    Role,
    RolePermission,
    Setting,
    SystemConfig,
    User,
    UserRole,
    Wallet,
    WalletTransaction
)
from app.seed.data import PRODUCTS, SEED_BLOGS, SEED_COUPONS
from app.models.entities import Coupon
from app.core.config import settings


def ensure_seed_data(db: Session) -> None:
    permissions = [
        "orders:read", "orders:write", "products:read", "products:write", "customers:read",
        "coupons:write", "delivery:write", "reviews:moderate", "settings:write", "analytics:read",
        "wallet.adjust", "payments.refund", "payments.manual", "exports.read", "rbac.write",
        "inventory.write", "shipments.write", "returns.write", "notifications.write",
        "cms.write", "users.write", "referrals.write", "inventory.adjust", "returns.decide",
        "subscriptions.write", "support.write", "growth.write", "delivery_slots.write"
    ]
    for role_name in ["customer", "admin", "superadmin"]:
        if not db.query(Role).filter_by(name=role_name).first():
            db.add(Role(name=role_name, description=f"{role_name.title()} role"))
    db.flush()
    for key in permissions:
        if not db.query(Permission).filter_by(key=key).first():
            db.add(Permission(key=key, description=f"Allows {key}"))
    db.flush()
    admin_role = db.query(Role).filter_by(name="admin").first()
    for permission in db.query(Permission).all():
        if admin_role and not db.query(RolePermission).filter_by(role_id=admin_role.id, permission_id=permission.id).first():
            db.add(RolePermission(role_id=admin_role.id, permission_id=permission.id))

    if not db.query(Category).filter_by(slug="fresh-atta").first():
        db.add(Category(slug="fresh-atta", name="Fresh Atta", active=True))
        db.flush()

    for item in PRODUCTS:
        product = db.query(Product).filter_by(slug=item["slug"]).first()
        if not product:
            product = Product(slug=item["slug"], name=item["name"], description=item.get("description") or f"{item['name']} freshly milled after order.")
            db.add(product)
            db.flush()
        else:
            product.name = item["name"]
            product.description = item.get("description") or product.description
        product.headline = item.get("headline") or product.headline
        product.benefit = item.get("benefit") or product.benefit
        product.ingredients = item.get("ingredients") or product.ingredients
        product.accent = item.get("accent") or product.accent
        product.hsn_code = item.get("hsn_code") or product.hsn_code or "11010000"
        product.gst_rate = item.get("gst_rate") if item.get("gst_rate") is not None else (product.gst_rate if product.gst_rate is not None else 5)
        for source_key, column in [
            ("nutrition", "nutrition_json"),
            ("proof", "proof_json"),
            ("best_for", "best_for_json"),
            ("comparison", "comparison_json"),
            ("storage", "storage_json"),
            ("notes", "notes_json"),
            ("faqs", "faqs_json"),
        ]:
            if source_key in item:
                setattr(product, column, json.dumps(item[source_key]))
        for variant in item["variants"]:
            exists = db.query(ProductVariant).filter_by(product_id=product.id, weight_kg=variant["weight_kg"]).first()
            if not exists:
                created = ProductVariant(product_id=product.id, weight_kg=variant["weight_kg"], price=variant["price"], inventory=200)
                db.add(created)
                db.flush()
                db.add(Inventory(variant_id=created.id, available=200, reserved=0))
            else:
                exists.price = variant["price"]
                if exists.inventory <= 0:
                    exists.inventory = 200
        for url in item.get("images", []):
            if not db.query(ProductImage).filter_by(product_id=product.id, url=url).first():
                db.add(ProductImage(product_id=product.id, url=url, alt=f"{item['name']} WheatRaja pack"))

    for coupon in SEED_COUPONS:
        if not db.query(Coupon).filter_by(code=coupon["code"]).first():
            db.add(Coupon(**coupon))

    loyalty_tiers = [
        ("Fresh Starter", 0, 1, ["Earn WR Wallet points", "Reorder reminders"]),
        ("Family Saver", 500, 1.25, ["Extra subscription rewards", "Priority support"]),
        ("Raja Circle", 1500, 1.5, ["Best coupon access", "Early campaign access"]),
    ]
    for name, min_points, multiplier, perks in loyalty_tiers:
        tier = db.query(LoyaltyTier).filter_by(name=name).first()
        if not tier:
            db.add(LoyaltyTier(name=name, min_points=min_points, reward_multiplier=multiplier, perks_json=json.dumps(perks), active=True))

    if not db.query(DeliveryRule).first():
        db.add_all([
            DeliveryRule(min_km=0, max_km=20, charge=0, deliverable=True),
            DeliveryRule(min_km=20, max_km=30, charge=40, deliverable=True),
            DeliveryRule(min_km=30, max_km=40, charge=70, deliverable=True),
            DeliveryRule(min_km=40, max_km=60, charge=100, deliverable=True),
            DeliveryRule(min_km=60, max_km=None, charge=None, deliverable=False, admin_override_allowed=True)
        ])
    if not db.query(DeliveryZone).filter_by(name="Noida Core").first():
        zone = DeliveryZone(name="Noida Core", active=True)
        db.add(zone)
        db.flush()
        db.add_all([
            DeliveryCharge(zone_id=zone.id, min_km=0, max_km=20, charge=0),
            DeliveryCharge(zone_id=zone.id, min_km=20, max_km=30, charge=40),
            Pincode(code="201301", zone_id=zone.id, distance_km=8),
            Pincode(code="201304", zone_id=zone.id, distance_km=18),
            Pincode(code="201305", zone_id=zone.id, distance_km=28)
        ])

    default_settings = {
        "wallet_active": "true",
        "brand_name": "Wheat Raja",
        "support_phone": "+91-98765-43210",
        "homepage_headline": "Fresh Atta, Milled After Your Order",
        "reminder_delivery_channels": "in_app,email,whatsapp"
    }
    for key, value in default_settings.items():
        if not db.query(Setting).filter_by(key=key).first():
            db.add(Setting(key=key, value=value))
    if not db.query(SystemConfig).filter_by(key="brand_name").first():
        db.add(SystemConfig(key="brand_name", value="Wheat Raja"))
    if not db.query(Banner).filter_by(title="Fresh Atta, Milled After Your Order").first():
        db.add(Banner(title="Fresh Atta, Milled After Your Order", link_url="/products", active=True))
    for blog in SEED_BLOGS:
        existing = db.query(BlogPost).filter_by(slug=blog["slug"]).first()
        if not existing:
            db.add(
                BlogPost(
                    **blog,
                    published=True,
                    status="published",
                    published_at=datetime.utcnow(),
                    author_name="WheatRaja Team",
                    tags_json=json.dumps([blog.get("category", "Blog").lower(), "fresh atta"]),
                    gallery_json="[]",
                    inline_images_json="[]",
                    featured=False,
                    pinned_rank=100,
                    content_format="markdown",
                )
            )
        else:
            for key, value in blog.items():
                setattr(existing, key, value)
            existing.status = existing.status or "published"
            existing.published = existing.status == "published"
            existing.published_at = existing.published_at or existing.created_at or datetime.utcnow()
            existing.author_name = existing.author_name or "WheatRaja Team"
            existing.tags_json = existing.tags_json or json.dumps([blog.get("category", "Blog").lower(), "fresh atta"])
            existing.gallery_json = existing.gallery_json or "[]"
            existing.inline_images_json = existing.inline_images_json or "[]"
            existing.content_format = existing.content_format or "markdown"
    seed_admin_phones = [phone.strip() for phone in settings.admin_phone_numbers.split(",") if phone.strip()]
    if settings.environment != "production" and not seed_admin_phones:
        seed_admin_phones = ["9999999999"]
    for admin_phone in seed_admin_phones:
        if settings.environment == "production" and admin_phone == "9999999999":
            continue
        admin = db.query(User).filter_by(phone=admin_phone).first()
        if not admin:
            admin = User(phone=admin_phone, role="admin", referral_code=generate_referral_code(db), wallet_active=True, profile_complete=True)
            db.add(admin)
            db.flush()
        else:
            admin.profile_complete = True
        if admin_role and not db.query(UserRole).filter_by(user_id=admin.id, role_id=admin_role.id).first():
            db.add(UserRole(user_id=admin.id, role_id=admin_role.id))
        if not db.query(Wallet).filter_by(user_id=admin.id).first():
            db.add(Wallet(user_id=admin.id, balance_points=0, enabled=True))
    db.commit()


def generate_referral_code(db: Session) -> str:
    alphabet = string.ascii_uppercase
    for _ in range(100):
        code = "".join(random.sample(alphabet, 4))
        if not db.query(User).filter_by(referral_code=code).first():
            return code
    raise RuntimeError("Could not generate referral code")


def get_or_create_user(db: Session, phone: str, role: str = "customer") -> User:
    user = db.query(User).filter_by(phone=phone).first()
    if user:
        if role == "admin" and user.role != "admin":
            user.role = "admin"
            user.profile_complete = True
        if not user.referral_code:
            user.referral_code = generate_referral_code(db)
        db.commit()
        db.refresh(user)
        return user
    user = User(phone=phone, role=role, referral_code=generate_referral_code(db), wallet_active=True, profile_complete=role == "admin")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def variant_by_slug_weight(db: Session, slug: str, weight_kg: int) -> ProductVariant | None:
    aliases = {
        "sharbati-atta": "mp-sharbati-atta",
        "multigrain-atta": "super-multigrain-atta",
        "sehori-atta": "sehori-sharbati-atta",
    }
    resolved_slug = aliases.get(slug, slug)
    return (
        db.query(ProductVariant)
        .join(Product)
        .filter(Product.slug == resolved_slug, ProductVariant.weight_kg == weight_kg, Product.active == True)
        .first()
    )


def parse_json_field(raw: str | None, fallback):
    if not raw:
        return fallback
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return fallback


def serialize_product(product: Product) -> dict:
    return {
        "id": product.id,
        "slug": product.slug,
        "name": product.name,
        "description": product.description,
        "headline": product.headline,
        "benefit": product.benefit,
        "ingredients": product.ingredients,
        "accent": product.accent,
        "nutrition": parse_json_field(product.nutrition_json, []),
        "proof": parse_json_field(product.proof_json, []),
        "best_for": parse_json_field(product.best_for_json, []),
        "comparison": parse_json_field(product.comparison_json, []),
        "storage": parse_json_field(product.storage_json, []),
        "notes": parse_json_field(product.notes_json, []),
        "faqs": parse_json_field(product.faqs_json, []),
        "active": product.active,
        "featured": product.featured,
        "category_id": product.category_id,
        "seo_title": product.seo_title,
        "seo_description": product.seo_description,
        "hsn_code": product.hsn_code,
        "gst_rate": money(product.gst_rate) if product.gst_rate is not None else None,
        "variants": [
            {
                "id": variant.id,
                "weight_kg": variant.weight_kg,
                "sku": variant.sku,
                "mrp": float(variant.mrp) if variant.mrp is not None else None,
                "price": float(variant.price),
                "discount_percent": variant.discount_percent,
                "low_stock_threshold": variant.low_stock_threshold,
                "inventory": variant.inventory
            }
            for variant in sorted(product.variants, key=lambda row: row.weight_kg)
        ],
        "images": [
            {"id": image.id, "url": image.url, "alt": image.alt}
            for image in product.images
        ]
    }


def wallet_balance(db: Session, user_id: int) -> int:
    rows = db.query(WalletTransaction).filter_by(user_id=user_id).all()
    return int(round(sum(money(row.amount) for row in rows)))


def money(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)
