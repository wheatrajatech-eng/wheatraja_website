import json
import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Notification, NotificationEvent
from app.services.http_client import post_json

logger = logging.getLogger("wheatraja.notifications")


@dataclass
class NotificationDelivery:
    status: str
    provider_message_id: str | None = None
    error: str | None = None


class NotificationProvider:
    channel = "unknown"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        raise NotImplementedError


class ConsoleNotificationProvider(NotificationProvider):
    def __init__(self, channel: str) -> None:
        self.channel = channel

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        if settings.environment == "production":
            raise RuntimeError(f"Console notification provider is not allowed for {self.channel} in production")
        logger.info("notification_console", extra={"event": event_type, "channel": self.channel, "user_id": user_id})
        return NotificationDelivery(status="sent", provider_message_id=f"console:{self.channel}:{event_type}")


class ResendEmailProvider(NotificationProvider):
    channel = "email"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            "https://api.resend.com/emails",
            {"from": settings.resend_from_email, "to": payload.get("email"), "subject": title, "text": body},
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
        )
        return NotificationDelivery(status="sent", provider_message_id=response.get("id"))


class SmtpEmailProvider(NotificationProvider):
    channel = "email"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        message = EmailMessage()
        message["From"] = settings.smtp_from_email
        message["To"] = payload.get("email")
        message["Subject"] = title
        message.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
        return NotificationDelivery(status="sent", provider_message_id=f"smtp:{event_type}")


class SesEmailProvider(NotificationProvider):
    channel = "email"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        import boto3

        client = boto3.client(
            "ses",
            region_name=settings.aws_ses_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        response = client.send_email(
            Source=settings.ses_from_email,
            Destination={"ToAddresses": [payload.get("email")]},
            Message={"Subject": {"Data": title}, "Body": {"Text": {"Data": body}}},
        )
        return NotificationDelivery(status="sent", provider_message_id=response.get("MessageId"))


class TwilioSmsProvider(NotificationProvider):
    channel = "sms"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json",
            {"From": settings.twilio_from_number, "To": payload.get("phone"), "Body": body},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            basic_auth=(settings.twilio_account_sid, settings.twilio_auth_token),
        )
        return NotificationDelivery(status="sent", provider_message_id=response.get("sid"))


class Msg91SmsProvider(NotificationProvider):
    channel = "sms"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            "https://control.msg91.com/api/v5/flow/",
            {"template_id": settings.msg91_template_id, "sender": settings.msg91_sender_id, "short_url": "0", "mobiles": payload.get("phone"), "body": body},
            headers={"authkey": settings.msg91_key},
        )
        return NotificationDelivery(status="sent", provider_message_id=str(response.get("request_id") or response.get("message")))


class MetaWhatsAppProvider(NotificationProvider):
    channel = "whatsapp"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            f"https://graph.facebook.com/v20.0/{settings.meta_whatsapp_phone_number_id}/messages",
            {"messaging_product": "whatsapp", "to": payload.get("phone"), "type": "text", "text": {"body": body}},
            headers={"Authorization": f"Bearer {settings.meta_whatsapp_token}"},
        )
        messages = response.get("messages") or []
        return NotificationDelivery(status="sent", provider_message_id=messages[0].get("id") if messages else None)


class InteraktWhatsAppProvider(NotificationProvider):
    channel = "whatsapp"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            "https://api.interakt.ai/v1/public/message/",
            {"countryCode": payload.get("country_code", "+91"), "phoneNumber": payload.get("phone"), "callbackData": event_type, "type": "Text", "data": {"message": body}},
            headers={"Authorization": f"Basic {settings.interakt_api_key}"},
        )
        return NotificationDelivery(status="sent", provider_message_id=str(response.get("id") or response.get("messageId")))


class GupshupWhatsAppProvider(NotificationProvider):
    channel = "whatsapp"

    def send(self, user_id: int | None, event_type: str, title: str, body: str, payload: dict) -> NotificationDelivery:
        response = post_json(
            "https://api.gupshup.io/sm/api/v1/msg",
            {"channel": "whatsapp", "source": settings.gupshup_source, "destination": payload.get("phone"), "message": {"type": "text", "text": body}},
            headers={"apikey": settings.gupshup_api_key},
        )
        return NotificationDelivery(status="sent", provider_message_id=str(response.get("messageId") or response.get("status")))


def provider_for(channel: str) -> NotificationProvider:
    configured = {
        "in_app": "database",
        "email": settings.email_provider,
        "sms": settings.sms_provider,
        "whatsapp": settings.whatsapp_provider,
    }.get(channel, settings.notification_provider)
    providers: dict[tuple[str, str], NotificationProvider] = {
        ("email", "resend"): ResendEmailProvider(),
        ("email", "smtp"): SmtpEmailProvider(),
        ("email", "ses"): SesEmailProvider(),
        ("sms", "twilio"): TwilioSmsProvider(),
        ("sms", "msg91"): Msg91SmsProvider(),
        ("whatsapp", "meta"): MetaWhatsAppProvider(),
        ("whatsapp", "interakt"): InteraktWhatsAppProvider(),
        ("whatsapp", "gupshup"): GupshupWhatsAppProvider(),
    }
    if configured in {"", "console", "database"}:
        return ConsoleNotificationProvider(channel)
    provider = providers.get((channel, configured))
    if not provider:
        raise RuntimeError(f"Unsupported notification provider: {channel}/{configured}")
    return provider


def create_notification(db: Session, user_id: int | None, event_type: str, title: str, body: str, payload: dict | None = None, channel: str = "in_app") -> None:
    payload_data = payload or {}
    if channel == "in_app":
        db.add(Notification(user_id=user_id, channel=channel, title=title, body=body, read=False))
        event = NotificationEvent(user_id=user_id, event_type=event_type, channel=channel, status="sent", payload_json=json.dumps({**payload_data, "provider_message_id": "database"}))
        db.add(event)
        db.flush()
        return
    event = NotificationEvent(user_id=user_id, event_type=event_type, channel=channel, status="queued", payload_json=json.dumps(payload_data))
    db.add(event)
    db.flush()
    try:
        delivery = provider_for(channel).send(user_id, event_type, title, body, payload_data)
        event.status = delivery.status
        event.payload_json = json.dumps({**payload_data, "provider_message_id": delivery.provider_message_id})
    except Exception as exc:
        event.status = "failed"
        event.payload_json = json.dumps({**payload_data, "error": str(exc)})
        logger.exception("notification_failed", extra={"event": event_type, "channel": channel})


def create_multichannel_notification(db: Session, user_id: int | None, event_type: str, title: str, body: str, payload: dict | None = None, channels: tuple[str, ...] = ("in_app",)) -> None:
    for channel in channels:
        create_notification(db, user_id, event_type, title, body, payload, channel)
