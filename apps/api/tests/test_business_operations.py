from pathlib import Path
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.orders import ManualOrderIn, create_manual_order
from app.api.payments import ManualPaymentIn, admin_manual_payment
from app.api.users import AdminCustomerIn, admin_upsert_customer
from app.core.database import Base
from app.models.entities import Inventory, Notification, Order, OrderItem, Payment, Product, ProductVariant, Referral, ReminderDeliveryOutbox, ReminderSchedule, User, WalletTransaction
from app.services.reminders import process_due_reminders, process_reminder_outbox, retry_failed_reminder_outbox, schedule_order_reorder_reminder, serialize_reminder_outbox_timeline
from app.services.referrals import reward_first_paid_order_referral
from app.services.notifications import NotificationDelivery


@pytest.fixture
def reminder_delivery(monkeypatch):
    monkeypatch.setattr("app.services.reminders.settings.reminder_delivery_channels", "in_app,email")

    class TestProvider:
        def send(self, user_id, event_type, title, body, payload):
            assert payload["email"] == "reminder@example.com"
            assert payload["outbox_id"]
            return NotificationDelivery(status="sent", provider_message_id="test-delivery")

    monkeypatch.setattr("app.services.reminders.provider_for", lambda channel: TestProvider())


def make_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine)()


def seed_catalog(db):
    admin = User(phone="9999999999", role="admin", profile_complete=True)
    product = Product(slug="manual-atta", name="Manual Atta", description="Manual order atta", active=True)
    db.add_all([admin, product])
    db.flush()
    variant = ProductVariant(product_id=product.id, weight_kg=5, price=250, inventory=20)
    db.add(variant)
    db.flush()
    db.add(Inventory(variant_id=variant.id, available=20, reserved=0))
    db.commit()


def test_admin_customer_manual_order_and_cod_payment_flow():
    engine, db = make_db()
    try:
        seed_catalog(db)
        admin = {"sub": "9999999999", "role": "admin"}
        customer = admin_upsert_customer(AdminCustomerIn(phone="9876543210", name="Manual Buyer", email="buyer@example.com"), admin, db)
        assert customer["phone"] == "9876543210"

        order = create_manual_order(
            ManualOrderIn(
                phone="9876543210",
                name="Manual Buyer",
                shipping_address="House 1, Noida",
                items=[{"slug": "manual-atta", "weight_kg": 5, "quantity": 2}],
                payment_method="cod",
                payment_status="pending",
                source_channel="instagram",
                source_detail="@buyer",
            ),
            admin,
            db,
        )
        assert order["source_channel"] == "instagram"
        inventory = db.query(Inventory).first()
        assert inventory.available == 18
        assert inventory.reserved == 2

        payment = admin_manual_payment(order["id"], ManualPaymentIn(method="cod", status="paid", amount_received=500, note="Collected on delivery"), admin, db)
        assert payment["payment_status"] == "paid"
        assert db.query(Payment).filter_by(order_id=order["database_id"], provider="manual").count() >= 2
        assert inventory.reserved == 0
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_first_paid_order_rewards_both_users_once():
    engine, db = make_db()
    try:
        seed_catalog(db)
        referrer = User(phone="9998887777", role="customer", profile_complete=True, referral_code="WXYZ")
        referred = User(phone="9876543210", role="customer", profile_complete=True)
        db.add_all([referrer, referred])
        db.flush()
        db.add(Referral(referrer_id=referrer.id, referred_user_id=referred.id, rewarded=False))
        product_variant = db.query(ProductVariant).first()
        order = Order(
            user_id=referred.id,
            order_number="WRREWARD1",
            customer_phone=referred.phone,
            address_text="House 1, Noida",
            delivery_area="Noida",
            delivery_eta="Same-day",
            status="placed",
            payment_status="paid",
            subtotal=250,
            discount_total=0,
            delivery_charge=0,
            wallet_amount=0,
            payable_amount=250,
            total=250,
        )
        db.add(order)
        db.flush()
        db.add(OrderItem(order_id=order.id, variant_id=product_variant.id, quantity=1, unit_price=250, subscription=False))
        db.flush()

        rewarded = reward_first_paid_order_referral(db, order)
        db.commit()

        assert rewarded is True
        assert db.query(Referral).first().rewarded is True
        credits = db.query(WalletTransaction).filter(WalletTransaction.reason == "referral_reward_first_order").all()
        assert len(credits) == 2
        assert {int(row.amount) for row in credits} == {100}

        second_reward = reward_first_paid_order_referral(db, order)
        db.commit()
        assert second_reward is False
        assert db.query(WalletTransaction).filter(WalletTransaction.reason == "referral_reward_first_order").count() == 2
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_reorder_reminder_schedules_and_processes_notification(reminder_delivery):
    engine, db = make_db()
    try:
        seed_catalog(db)
        customer = User(phone="9876543210", email="reminder@example.com", role="customer", profile_complete=True, referral_code="ABCD")
        db.add(customer)
        db.flush()
        product_variant = db.query(ProductVariant).first()
        order = Order(
            user_id=customer.id,
            order_number="WRREM1",
            customer_phone=customer.phone,
            address_text="House 1, Noida",
            delivery_area="Noida",
            delivery_eta="Same-day",
            status="placed",
            payment_status="paid",
            subtotal=1250,
            discount_total=0,
            delivery_charge=0,
            wallet_amount=0,
            payable_amount=1250,
            total=1250,
        )
        db.add(order)
        db.flush()
        db.add(OrderItem(order_id=order.id, variant_id=product_variant.id, quantity=5, unit_price=250, subscription=False))
        db.flush()

        reminder = schedule_order_reorder_reminder(db, order)
        db.commit()
        assert reminder is not None
        schedule = db.query(ReminderSchedule).filter_by(schedule_key="order:WRREM1:reorder").first()
        assert schedule is not None
        schedule.reminder_at = schedule.reminder_at.replace(year=schedule.reminder_at.year - 1)
        db.commit()

        processed = process_due_reminders(db)
        db.commit()
        assert processed == 1
        assert db.query(ReminderDeliveryOutbox).filter_by(reminder_schedule_id=schedule.id, channel="email").count() == 1
        notification = db.query(Notification).filter_by(user_id=customer.id).first()
        assert notification is not None
        assert "reorder" in notification.title.lower()
        assert db.query(ReminderSchedule).filter_by(schedule_key="order:WRREM1:reorder", status="processing").count() == 1

        sent = process_reminder_outbox(db)
        db.commit()
        assert sent == 1
        assert db.query(ReminderDeliveryOutbox).first().attempts == 1
        assert db.query(ReminderSchedule).filter_by(schedule_key="order:WRREM1:reorder", status="sent").count() == 1
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_failed_outbox_bulk_retry_and_timeline(monkeypatch, reminder_delivery):
    engine, db = make_db()
    try:
        seed_catalog(db)
        customer = User(phone="9876543210", email="reminder@example.com", role="customer", profile_complete=True, referral_code="ABCD")
        db.add(customer)
        db.flush()
        product_variant = db.query(ProductVariant).first()
        order = Order(
            user_id=customer.id,
            order_number="WRREM2",
            customer_phone=customer.phone,
            address_text="House 1, Noida",
            delivery_area="Noida",
            delivery_eta="Same-day",
            status="placed",
            payment_status="paid",
            subtotal=1250,
            discount_total=0,
            delivery_charge=0,
            wallet_amount=0,
            payable_amount=1250,
            total=1250,
        )
        db.add(order)
        db.flush()
        db.add(OrderItem(order_id=order.id, variant_id=product_variant.id, quantity=5, unit_price=250, subscription=False))
        db.flush()

        reminder = schedule_order_reorder_reminder(db, order)
        db.commit()
        assert reminder is not None
        schedule = db.query(ReminderSchedule).filter_by(schedule_key="order:WRREM2:reorder").first()
        assert schedule is not None
        schedule.reminder_at = schedule.reminder_at.replace(year=schedule.reminder_at.year - 1)
        db.commit()

        processed = process_due_reminders(db)
        db.commit()
        assert processed == 1

        class FailingProvider:
            def send(self, *args, **kwargs):
                raise RuntimeError("boom")

        monkeypatch.setattr("app.services.reminders.provider_for", lambda channel: FailingProvider())
        monkeypatch.setattr("app.services.reminders.settings.reminder_outbox_max_attempts", 1)
        monkeypatch.setattr("app.services.reminders.settings.reminder_outbox_retry_minutes", 15)

        sent = process_reminder_outbox(db)
        db.commit()
        assert sent == 0

        failed_row = db.query(ReminderDeliveryOutbox).filter_by(reminder_schedule_id=schedule.id, channel="email").first()
        assert failed_row is not None
        assert failed_row.status == "failed"

        retried = retry_failed_reminder_outbox(db)
        assert retried == 1
        assert failed_row.status == "queued"
        assert schedule.status == "processing"

        timeline = serialize_reminder_outbox_timeline(db, failed_row)
        assert timeline["row"]["id"] == failed_row.id
        assert any(entry["source"] == "notification_event" for entry in timeline["timeline"])
        assert any(entry["label"] == "Retry requested" for entry in timeline["timeline"])
    finally:
        db.close()
        Base.metadata.drop_all(engine)
