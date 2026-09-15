from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import settings
from app.services.notifications import ConsoleNotificationProvider
from app.services.razorpay_provider import RazorpayProvider


def test_razorpay_checkout_signature_validation(monkeypatch):
    monkeypatch.setattr(settings, "razorpay_key_secret", "secret")
    provider = RazorpayProvider()
    import hashlib
    import hmac

    signature = hmac.new(b"secret", b"order_123|pay_123", hashlib.sha256).hexdigest()
    assert provider.verify_checkout_signature(razorpay_order_id="order_123", razorpay_payment_id="pay_123", signature=signature)
    assert not provider.verify_checkout_signature(razorpay_order_id="order_123", razorpay_payment_id="pay_999", signature=signature)


def test_razorpay_webhook_event_id_prefers_entity_and_created_at():
    payload = {"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_123", "created_at": 12345}}}}
    assert RazorpayProvider().webhook_event_id(payload) == "payment.captured:pay_123:12345"


def test_console_notification_provider_fails_closed_in_production(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    with pytest.raises(RuntimeError):
        ConsoleNotificationProvider("email").send(None, "test", "Title", "Body", {})
    monkeypatch.setattr(settings, "environment", "development")
