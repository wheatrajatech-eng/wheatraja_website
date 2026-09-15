from pathlib import Path
import sys

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api import payments
from app.api.payments import PaymentVerifyIn, verify_payment
from app.core.config import Settings, settings
from app.core.database import Base
from app.models.entities import Inventory, Order, Payment, Product, ProductVariant, User
from app.services.readiness import launch_readiness_checks


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


def seed_payment_order(db):
    user = User(phone="9876543210", role="customer", profile_complete=True)
    product = Product(slug="launch-atta", name="Launch Atta", description="Fresh", active=True, hsn_code="11010000", gst_rate=5)
    db.add_all([user, product])
    db.flush()
    variant = ProductVariant(product_id=product.id, weight_kg=5, price=250, inventory=10)
    db.add(variant)
    db.flush()
    db.add(Inventory(variant_id=variant.id, available=10, reserved=0))
    order = Order(
        user_id=user.id,
        order_number="WRLAUNCH1",
        customer_phone=user.phone,
        address_text="Test address",
        delivery_area="Noida",
        delivery_eta="Same-day",
        status="pending_payment",
        payment_status="pending",
        subtotal=250,
        discount_total=0,
        delivery_charge=0,
        wallet_amount=0,
        payable_amount=250,
        total=250,
    )
    db.add(order)
    db.flush()
    db.add(Payment(order_id=order.id, provider="razorpay", provider_order_id="order_123", amount=250, status="created"))
    db.commit()
    return order


def test_payment_verify_rejects_authorized_not_captured(db, monkeypatch):
    order = seed_payment_order(db)
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret")
    monkeypatch.setattr(payments.razorpay_provider, "verify_checkout_signature", lambda **kwargs: True)
    monkeypatch.setattr(payments.razorpay_provider, "fetch_payment", lambda payment_id: {"id": payment_id, "order_id": "order_123", "status": "authorized", "amount": 25000})

    with pytest.raises(HTTPException) as exc:
        verify_payment(
            PaymentVerifyIn(order_id=order.order_number, razorpay_order_id="order_123", razorpay_payment_id="pay_123", razorpay_signature="sig"),
            {"sub": "9876543210", "role": "customer"},
            db,
        )

    assert exc.value.status_code == 400
    assert db.query(Order).filter_by(order_number=order.order_number).first().payment_status == "pending"


def test_payment_verify_is_idempotent_after_captured_success(db, monkeypatch):
    order = seed_payment_order(db)
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret")
    monkeypatch.setattr(payments.razorpay_provider, "verify_checkout_signature", lambda **kwargs: True)
    monkeypatch.setattr(payments.razorpay_provider, "fetch_payment", lambda payment_id: {"id": payment_id, "order_id": "order_123", "status": "captured", "amount": 25000})
    payload = PaymentVerifyIn(order_id=order.order_number, razorpay_order_id="order_123", razorpay_payment_id="pay_123", razorpay_signature="sig")

    first = verify_payment(payload, {"sub": "9876543210", "role": "customer"}, db)
    second = verify_payment(payload, {"sub": "9876543210", "role": "customer"}, db)

    assert first["verified"] is True
    assert second["duplicate"] is True
    assert db.query(Payment).filter_by(provider_payment_id="pay_123").count() == 1


def test_production_settings_reject_console_and_local_provider_defaults():
    with pytest.raises(ValidationError):
        Settings(
            environment="production",
            jwt_secret="x" * 40,
            razorpay_key_id="rzp_live_key",
            razorpay_key_secret="secret",
            razorpay_webhook_secret="webhook",
            admin_phone_numbers="9999999999",
            allow_dev_otp=True,
            otp_dev_code="246810",
            csrf_protection_enabled=False,
        )


def test_readiness_blocks_active_products_without_hsn_or_gst(db):
    db.add(Product(slug="missing-tax", name="Missing Tax", description="Bad", active=True))
    db.commit()

    checks = {row["key"]: row for row in launch_readiness_checks(db)}

    assert checks["product_tax"]["ok"] is False
