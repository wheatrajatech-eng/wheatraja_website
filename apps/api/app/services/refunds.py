import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Payment, Refund
from app.core.config import settings
from app.services.razorpay_provider import RazorpayProvider, dumps_provider_payload


def create_provider_refund(db: Session, payment: Payment, refund: Refund) -> Refund:
    if payment.status == "demo_paid":
        if settings.environment == "production":
            raise HTTPException(status_code=400, detail="Demo refunds are disabled in production")
        refund.status = "processed"
        refund.provider_refund_id = f"demo_refund_{refund.id}"
        refund.payload_json = json.dumps({"mode": "demo"})
        return refund

    if payment.provider != "razorpay" or not payment.provider_payment_id:
        if settings.environment == "production":
            raise HTTPException(status_code=400, detail="Live refund requires a provider payment id")
        refund.status = "processed"
        refund.provider_refund_id = f"dev_refund_{refund.id}"
        refund.payload_json = json.dumps({"mode": "development_stub"})
        return refund

    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        if settings.environment == "production":
            raise HTTPException(status_code=500, detail="Razorpay refund keys are not configured")
        refund.status = "processed"
        refund.provider_refund_id = f"dev_refund_{refund.id}"
        refund.payload_json = json.dumps({"mode": "development_stub"})
        return refund

    try:
        payload = RazorpayProvider().refund_payment(payment.provider_payment_id, float(refund.amount), refund.reason or "admin_refund")
    except Exception as exc:
        refund.status = "provider_failed"
        refund.payload_json = json.dumps({"error": str(exc)})
        raise HTTPException(status_code=502, detail="Razorpay refund failed") from exc

    refund.status = payload.get("status", "processed")
    refund.provider_refund_id = payload.get("id")
    refund.payload_json = dumps_provider_payload(payload)
    return refund
