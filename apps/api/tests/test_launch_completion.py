from pathlib import Path
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.orders import ManualOrderIn, create_manual_order
from app.core.database import Base
from app.models.entities import EmailAttemptLog, Inventory, Product, ProductVariant, User
from app.services import email_service
from app.services.email_service import EmailMessagePayload, EmailService
from app.services.invoices import invoice_payload, render_invoice_pdf
from app.services.storage import store_image


def make_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine)()


def seed_order(db):
    admin = User(phone="9999999999", role="admin", profile_complete=True)
    product = Product(slug="invoice-atta", name="Invoice Atta", description="PDF atta", active=True, hsn_code="11010000", gst_rate=5)
    db.add_all([admin, product])
    db.flush()
    variant = ProductVariant(product_id=product.id, weight_kg=5, sku="WR-INV-5", price=250, inventory=10)
    db.add(variant)
    db.flush()
    db.add(Inventory(variant_id=variant.id, available=10, reserved=0))
    db.commit()
    order_data = create_manual_order(
        ManualOrderIn(
            phone="9876543210",
            name="Invoice Buyer",
            email="buyer@example.com",
            shipping_address="House 1, Noida",
            billing_address="Billing House 1, Noida",
            items=[{"slug": "invoice-atta", "weight_kg": 5, "quantity": 1}],
            payment_method="cod",
            payment_status="paid",
            amount_received=250,
        ),
        {"sub": "9999999999", "role": "admin"},
        db,
    )
    return order_data


def test_email_service_fallback_logs_without_secret_body(monkeypatch):
    engine, db = make_db()
    try:
        class FailingProvider:
            name = "primary"

            def send(self, message):
                raise RuntimeError("provider down")

        class WorkingProvider:
            name = "fallback"

            def send(self, message):
                return "ok"

        def fake_provider(name):
            return FailingProvider() if name == "gmail" else WorkingProvider()

        monkeypatch.setattr(email_service.settings, "email_provider", "gmail")
        monkeypatch.setattr(email_service.settings, "email_fallback_provider", "ses")
        monkeypatch.setattr(email_service.settings, "email_retry_limit", 1)
        monkeypatch.setattr(email_service, "build_provider", fake_provider)

        sent = EmailService(db).send(EmailMessagePayload(event_type="otp", to_email="buyer@example.com", subject="OTP", text="123456"))
        db.commit()

        assert sent is True
        logs = db.query(EmailAttemptLog).order_by(EmailAttemptLog.id.asc()).all()
        assert [row.status for row in logs] == ["failed", "sent"]
        assert "123456" not in " ".join(row.error or "" for row in logs)
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def test_local_image_upload_validation_and_safe_name(tmp_path, monkeypatch):
    monkeypatch.setattr("app.services.storage.settings.storage_provider", "local")
    monkeypatch.setattr("app.services.storage.settings.local_upload_dir", str(tmp_path))
    monkeypatch.setattr("app.services.storage.settings.public_upload_base_url", "/uploads")
    monkeypatch.setattr("app.services.storage.settings.upload_max_bytes", 1024)

    stored = store_image(b"\x89PNG\r\n\x1a\nfake-image", "../../Unsafe Name.png", "image/png")

    assert stored.url.startswith("/uploads/unsafe-name-")
    assert stored.file_name.endswith(".png")
    assert (tmp_path / stored.file_name).exists()


def test_invoice_payload_and_pdf_generation():
    engine, db = make_db()
    try:
        order_data = seed_order(db)
        from app.models.entities import Order

        order = db.query(Order).filter_by(order_number=order_data["id"]).first()
        payload = invoice_payload(db, order)
        pdf = render_invoice_pdf(payload)

        assert payload["invoice_number"].startswith("WR/")
        assert payload["items"][0]["sku"] == "WR-INV-5"
        assert payload["items"][0]["hsn"] == "11010000"
        assert pdf.startswith(b"%PDF")
    finally:
        db.close()
        Base.metadata.drop_all(engine)
