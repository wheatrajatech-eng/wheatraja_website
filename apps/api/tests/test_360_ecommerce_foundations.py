from datetime import datetime, timedelta
from pathlib import Path
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.growth import (
    BlogProductLinkIn,
    ProductQuizIn,
    RecoveryCartIn,
    RecoveryItemIn,
    SupportTicketIn,
    customer_360,
    create_support_ticket,
    loyalty_tiers,
    my_loyalty,
    product_quiz,
    upsert_blog_product_link,
    upsert_recovery_cart,
)
from app.api.orders import OrderCreateIn, OrderItemIn, create_order, reorder_items
from app.core.database import Base
from app.models.entities import AbandonedCartRecovery, BlogPost, Coupon, DeliveryRule, Inventory, LoyaltyTier, Order, OrderItem, Product, ProductImage, ProductVariant, User, WalletTransaction


def make_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine)()


def seed_catalog(db):
    user = User(phone="9876543210", role="customer", profile_complete=True, referral_code="ABCD")
    admin = User(phone="9999999999", role="admin", profile_complete=True, referral_code="WXYZ")
    product_one = Product(slug="mp-sharbati-atta", name="MP Sharbati Atta", description="Soft premium atta", active=True, featured=True)
    product_two = Product(slug="super-multigrain-atta", name="Super Multigrain Atta", description="Nutrition atta", active=True)
    db.add_all([user, admin, product_one, product_two, Coupon(code="SAVE05", percent_off=5, active=True), DeliveryRule(min_km=0, max_km=20, charge=0, deliverable=True)])
    db.flush()
    for product in [product_one, product_two]:
        variant = ProductVariant(product_id=product.id, weight_kg=5, price=250, inventory=20, low_stock_threshold=3)
        db.add(variant)
        db.flush()
        db.add_all([Inventory(variant_id=variant.id, available=20, reserved=0), ProductImage(product_id=product.id, url="/pack.png", alt=product.name)])
    db.add_all([
        LoyaltyTier(name="Fresh Starter", min_points=0, reward_multiplier=1, perks_json='["Earn points"]', active=True),
        LoyaltyTier(name="Family Saver", min_points=500, reward_multiplier=1.25, perks_json='["Priority support"]', active=True),
    ])
    post = BlogPost(slug="fresh-atta-note", title="Fresh Atta Note", excerpt="Fresh", body="Body", category="Blog", status="published", published=True, published_at=datetime.utcnow())
    db.add(post)
    db.commit()
    return user, admin, product_one, product_two, post


def test_product_quiz_returns_usage_pack_and_products():
    engine, db = make_db()
    try:
        seed_catalog(db)
        result = product_quiz(ProductQuizIn(family_size=4, rotis_per_day=16, preference="nutrition", delivery_cycle_days=30), db)
        assert result["estimated_monthly_kg"] >= 1
        assert result["recommended_weight_kg"] in {1, 5, 10}
        assert result["products"][0]["slug"] == "super-multigrain-atta"
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_abandoned_cart_converts_when_order_is_created():
    engine, db = make_db()
    try:
        user, _admin, _p1, _p2, _post = seed_catalog(db)
        recovery = upsert_recovery_cart(
            RecoveryCartIn(phone=user.phone, items=[RecoveryItemIn(slug="mp-sharbati-atta", weight_kg=5, quantity=1)], subtotal=250),
            db,
        )
        assert recovery["status"] == "open"
        order = create_order(
            OrderCreateIn(items=[OrderItemIn(slug="mp-sharbati-atta", weight_kg=5, quantity=1)], coupon="", distance_km=8, wallet_amount=0, address="Test address Noida 201301", delivery_area="Noida"),
            {"sub": user.phone, "role": "customer"},
            db,
        )
        assert order["id"].startswith("WR")
        refreshed = db.query(AbandonedCartRecovery).filter_by(id=recovery["id"]).first()
        assert refreshed.status == "converted"
        assert refreshed.converted_order_id is not None
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_reorder_items_and_loyalty_payload():
    engine, db = make_db()
    try:
        user, _admin, product, _p2, _post = seed_catalog(db)
        variant = db.query(ProductVariant).filter_by(product_id=product.id).first()
        order = Order(user_id=user.id, order_number="WRREORDER", customer_phone=user.phone, address_text="Noida", delivery_area="Noida", delivery_eta="Same-day", status="delivered", payment_status="paid", subtotal=250, discount_total=0, delivery_charge=0, wallet_amount=0, payable_amount=250, total=250)
        db.add(order)
        db.flush()
        db.add_all([OrderItem(order_id=order.id, variant_id=variant.id, quantity=1, unit_price=250), WalletTransaction(user_id=user.id, amount=600, transaction_type="credit", reason="test")])
        db.commit()

        payload = reorder_items("WRREORDER", {"sub": user.phone, "role": "customer"}, db)
        loyalty = my_loyalty({"sub": user.phone, "role": "customer"}, db)
        assert payload["items"][0]["slug"] == product.slug
        assert loyalty["tier"]["name"] == "Family Saver"
        assert len(loyalty_tiers(db)) == 2
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_support_ticket_blog_product_link_and_customer_360():
    engine, db = make_db()
    try:
        user, admin, product, _p2, post = seed_catalog(db)
        ticket = create_support_ticket(SupportTicketIn(category="delivery", subject="Late delivery", message="Please check my order"), {"sub": user.phone, "role": "customer"}, db)
        assert ticket["status"] == "open"

        link = upsert_blog_product_link(BlogProductLinkIn(slug=post.slug, product_slug=product.slug), {"sub": admin.phone, "role": "admin"}, db)
        profile = customer_360(user.id, {"sub": admin.phone, "role": "admin"}, db)
        assert link["ok"] is True
        assert profile["customer"]["phone"] == user.phone
        assert profile["tickets"][0]["ticket_number"] == ticket["ticket_number"]
    finally:
        db.close()
        Base.metadata.drop_all(engine)
