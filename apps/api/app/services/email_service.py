import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import EmailAttemptLog

logger = logging.getLogger("wheatraja.email")


@dataclass
class EmailMessagePayload:
    event_type: str
    to_email: str
    subject: str
    text: str


class EmailProvider:
    name = "unknown"

    def send(self, message: EmailMessagePayload) -> str | None:
        raise NotImplementedError


class SmtpEmailProvider(EmailProvider):
    name = "smtp"

    def __init__(self, host: str, port: int, username: str, password: str, from_email: str) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.from_email = from_email

    def send(self, message: EmailMessagePayload) -> str | None:
        email = EmailMessage()
        email["From"] = self.from_email
        email["To"] = message.to_email
        email["Subject"] = message.subject
        email.set_content(message.text)
        with smtplib.SMTP(self.host, self.port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(self.username, self.password)
            smtp.send_message(email)
        return f"{self.name}:{message.event_type}"


class GmailEmailProvider(SmtpEmailProvider):
    name = "gmail"


class SesEmailProvider(EmailProvider):
    name = "ses"

    def send(self, message: EmailMessagePayload) -> str | None:
        import boto3

        client = boto3.client(
            "ses",
            region_name=settings.aws_ses_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        response = client.send_email(
            Source=settings.ses_from_email,
            Destination={"ToAddresses": [message.to_email]},
            Message={"Subject": {"Data": message.subject}, "Body": {"Text": {"Data": message.text}}},
        )
        return response.get("MessageId")


class ConsoleEmailProvider(EmailProvider):
    name = "console"

    def send(self, message: EmailMessagePayload) -> str | None:
        if settings.environment == "production":
            raise RuntimeError("Console email provider is not allowed in production")
        logger.info("email_console", extra={"event": message.event_type, "recipient": message.to_email, "subject": message.subject})
        return f"console:{message.event_type}"


def build_provider(name: str) -> EmailProvider:
    normalized = (name or "console").strip().lower()
    if normalized == "gmail":
        return GmailEmailProvider(
            settings.gmail_smtp_host or "smtp.gmail.com",
            settings.gmail_smtp_port,
            settings.gmail_smtp_user,
            settings.gmail_smtp_password,
            settings.gmail_from_email or settings.gmail_smtp_user,
        )
    if normalized == "smtp":
        return SmtpEmailProvider(settings.smtp_host, settings.smtp_port, settings.smtp_username, settings.smtp_password, settings.smtp_from_email)
    if normalized == "ses":
        return SesEmailProvider()
    if normalized in {"", "console"}:
        return ConsoleEmailProvider()
    raise RuntimeError(f"Unsupported email provider: {name}")


class EmailService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _log(self, provider: str, message: EmailMessagePayload, status: str, error: str | None = None) -> None:
        self.db.add(
            EmailAttemptLog(
                provider=provider,
                recipient=message.to_email,
                subject=message.subject,
                event_type=message.event_type,
                status=status,
                error=error[:4000] if error else None,
            )
        )
        self.db.flush()

    def send(self, message: EmailMessagePayload) -> bool:
        providers = [settings.email_provider]
        if settings.email_fallback_provider and settings.email_fallback_provider not in providers:
            providers.append(settings.email_fallback_provider)
        last_error: Exception | None = None
        for provider_name in providers:
            provider = build_provider(provider_name)
            attempts = max(1, settings.email_retry_limit)
            for _ in range(attempts):
                try:
                    provider.send(message)
                    self._log(provider.name, message, "sent")
                    return True
                except Exception as exc:
                    last_error = exc
                    self._log(provider.name, message, "failed", str(exc))
                    logger.exception("email_send_failed", extra={"event": message.event_type, "provider": provider.name, "recipient": message.to_email})
        if last_error:
            logger.error("email_delivery_exhausted", extra={"event": message.event_type, "recipient": message.to_email})
        return False

    def send_otp_email(self, to_email: str, otp: str) -> bool:
        return self.send(
            EmailMessagePayload(
                event_type="otp",
                to_email=to_email,
                subject="Your WheatRaja verification code",
                text=f"Your WheatRaja verification code is {otp}. It expires in 5 minutes.",
            )
        )

    def send_forgot_password_email(self, to_email: str, reset_hint: str) -> bool:
        return self.send(
            EmailMessagePayload(
                event_type="forgot_password",
                to_email=to_email,
                subject="WheatRaja account access",
                text=f"Use OTP login to access your WheatRaja account. Registered phone: {reset_hint}.",
            )
        )

    def send_welcome_coupon_email(self, to_email: str, coupon_code: str = "WELCOME10") -> bool:
        return self.send(
            EmailMessagePayload(
                event_type="welcome_coupon",
                to_email=to_email,
                subject="Welcome to WheatRaja",
                text=f"Welcome to WheatRaja. Use coupon {coupon_code} on your first eligible order.",
            )
        )

    def send_notification_email(self, to_email: str, subject: str, body: str) -> bool:
        return self.send(EmailMessagePayload(event_type="notification", to_email=to_email, subject=subject, text=body))
