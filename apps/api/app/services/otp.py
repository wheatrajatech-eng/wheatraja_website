import random
import base64
import json
import urllib.parse
import urllib.request
from app.core.config import settings


def generate_otp() -> str:
    if settings.environment != "production" and settings.allow_dev_otp:
        return settings.otp_dev_code
    return f"{random.randint(100000, 999999)}"


def send_otp(phone: str, otp: str) -> None:
    if settings.environment != "production" and settings.allow_dev_otp:
        return
    if settings.otp_provider == "twilio":
        if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_verify_service_sid:
            raise RuntimeError("Twilio Verify is not configured")
        _twilio_request({"To": phone, "Channel": "sms"}, "Verifications")
        return
    if not settings.msg91_key or not settings.msg91_template_id:
        raise RuntimeError("MSG91 is not configured")
    params = {
        "template_id": settings.msg91_template_id,
        "mobile": phone,
        "otp": otp,
    }
    if settings.msg91_sender_id:
        params["sender"] = settings.msg91_sender_id
    url = f"{settings.msg91_otp_url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"authkey": settings.msg91_key})
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status >= 400:
            raise RuntimeError("MSG91 rejected OTP request")


def verify_otp(phone: str, otp: str) -> bool:
    if settings.otp_provider != "twilio":
        return False
    if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_verify_service_sid:
        raise RuntimeError("Twilio Verify is not configured")
    return _twilio_request({"To": phone, "Code": otp}, "VerificationCheck").get("status") == "approved"


def _twilio_request(values: dict[str, str], resource: str) -> dict:
    url = f"https://verify.twilio.com/v2/Services/{settings.twilio_verify_service_sid}/{resource}"
    credentials = base64.b64encode(f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode()).decode()
    request = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(values).encode(),
        method="POST",
        headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode() or "{}")
            if response.status >= 400:
                raise RuntimeError("Twilio rejected OTP request")
            return payload
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError) as exc:
        raise RuntimeError("Twilio rejected OTP request") from exc
