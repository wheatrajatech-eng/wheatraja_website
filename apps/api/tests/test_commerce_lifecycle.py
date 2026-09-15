from pathlib import Path
import sys

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.auth import admin_phones
from app.api.shipments import sync_order_from_shipment
from app.core.auth_deps import require_admin
from app.core.database import Base
from app.core.security import create_token
from app.models.entities import Inventory, Order, OrderItem, Payment, Product, ProductVariant, Refund, ReturnRequest, User, Wishlist
from app.services.inventory_lifecycle import commit_order_inventory, release_order_inventory, reserve_order_inventory
from app.services.refunds import create_provider_refund


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def seed_order(db):
    user = User(phone="9876543210", role="customer", profile_complete=True)
    product = Product(slug="atta-test", name="Test Atta", description="Fresh atta", active=True)
    db.add_all([user, product])
    db.flush()
    variant = ProductVariant(product_id=product.id, weight_kg=5, price=250, inventory=10)
    db.add(variant)
    db.flush()
    inventory = Inventory(variant_id=variant.id, available=10, reserved=0)
    order = Order(
        user_id=user.id,
        order_number="WRTEST1",
        customer_phone=user.phone,
        address_text="Test address, Noida",
        delivery_area="Noida",
        delivery_eta="Same-day",
        status="pending_payment",
        payment_status="pending",
        subtotal=500,
        discount_total=0,
        delivery_charge=0,
        wallet_amount=0,
        payable_amount=500,
        total=500,
    )
    db.add_all([inventory, order])
    db.flush()
    db.add(OrderItem(order_id=order.id, variant_id=variant.id, quantity=2, unit_price=250, subscription=False))
    db.flush()
    return user, product, variant, inventory, order


def test_inventory_reservation_and_payment_commit(db):
    _user, _product, variant, inventory, order = seed_order(db)
    line = type("Line", (), {"quantity": 2})()
    reserve_order_inventory(db, order, [(line, variant, 250)])
    assert inventory.available == 8
    assert inventory.reserved == 2

    commit_order_inventory(db, order)
    assert inventory.available == 8
    assert inventory.reserved == 0
    assert variant.inventory == 8


def test_payment_failure_or_cancel_releases_reserved_stock(db):
    _user, _product, variant, inventory, order = seed_order(db)
    line = type("Line", (), {"quantity": 2})()
    reserve_order_inventory(db, order, [(line, variant, 250)])

    release_order_inventory(db, order, "payment_failed")
    assert inventory.available == 10
    assert inventory.reserved == 0
    assert variant.inventory == 10


def test_return_request_model_links_order_and_user(db):
    user, _product, _variant, _inventory, order = seed_order(db)
    row = ReturnRequest(order_id=order.id, user_id=user.id, reason="Damaged pack", status="requested")
    db.add(row)
    db.commit()
    assert db.query(ReturnRequest).filter_by(order_id=order.id, user_id=user.id).count() == 1


def test_refund_provider_uses_development_stub_without_live_payment(db):
    _user, _product, _variant, _inventory, order = seed_order(db)
    payment = Payment(order_id=order.id, provider="razorpay", amount=500, status="paid")
    db.add(payment)
    db.flush()
    refund = Refund(payment_id=payment.id, amount=100, reason="Test refund")
    db.add(refund)
    db.flush()
    create_provider_refund(db, payment, refund)
    assert refund.status == "processed"
    assert refund.provider_refund_id


def test_shipment_event_syncs_order_status(db):
    _user, _product, _variant, _inventory, order = seed_order(db)
    sync_order_from_shipment(order, "shipped")
    assert order.status == "shipped"
    sync_order_from_shipment(order, "delivered")
    assert order.status == "delivered"


def test_wishlist_add_remove_model_constraint_path(db):
    user, product, _variant, _inventory, _order = seed_order(db)
    item = Wishlist(user_id=user.id, product_id=product.id)
    db.add(item)
    db.commit()
    assert db.query(Wishlist).filter_by(user_id=user.id).count() == 1
    db.delete(item)
    db.commit()
    assert db.query(Wishlist).filter_by(user_id=user.id).count() == 0


def test_admin_permission_protection_rejects_customer_token(monkeypatch):
    token = create_token("9876543210", "customer")
    with pytest.raises(HTTPException) as exc:
        require_admin(token)
    assert exc.value.status_code == 403
    assert "9999999999" in admin_phones()
