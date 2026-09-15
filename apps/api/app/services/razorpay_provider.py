import hashlib
import hmac
import json
import logging

from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger("wheatraja.payments")


class RazorpayProvider:
    def configured(self) -> bool:
        return bool(settings.razorpay_key_id and settings.razorpay_key_secret)

    def client(self):
        if not self.configured():
            raise HTTPException(status_code=500, detail="Razorpay keys are not configured")
        import razorpay

        return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

    def create_order(self, *, amount_paise: int, receipt: str) -> dict:
        provider_order = self.client().order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
                "payment_capture": 1,
                "notes": {"receipt": receipt},
            }
        )
        logger.info("razorpay_order_created", extra={"event": "payment.order.created", "order_id": receipt, "payment_id": provider_order.get("id")})
        return provider_order

    def verify_checkout_signature(self, *, razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
        expected = hmac.new(settings.razorpay_key_secret.encode(), message, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def verify_webhook_signature(self, body: bytes, signature: str | None) -> bool:
        if not settings.razorpay_webhook_secret:
            return settings.environment != "production"
        expected = hmac.new(settings.razorpay_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature or "")

    def fetch_payment(self, payment_id: str) -> dict:
        payment = self.client().payment.fetch(payment_id)
        logger.info("razorpay_payment_fetched", extra={"event": "payment.fetch", "payment_id": payment_id})
        return payment

    def refund_payment(self, payment_id: str, amount: float, reason: str) -> dict:
        payload = self.client().payment.refund(
            payment_id,
            {
                "amount": int(round(float(amount) * 100)),
                "speed": "normal",
                "notes": {"reason": reason},
            },
        )
        logger.info("razorpay_refund_created", extra={"event": "refund.created", "payment_id": payment_id})
        return payload

    def webhook_event_id(self, payload: dict) -> str:
        entity = payload.get("payload", {}).get("payment", {}).get("entity") or payload.get("payload", {}).get("refund", {}).get("entity", {})
        return payload.get("event", "unknown") + ":" + str(entity.get("id", "unknown")) + ":" + str(entity.get("created_at", "0"))


def dumps_provider_payload(payload: dict) -> str:
    return json.dumps(payload, separators=(",", ":"), default=str)
