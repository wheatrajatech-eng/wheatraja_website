from pathlib import Path
import os

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from dotenv import dotenv_values
from sqlalchemy.engine import URL, make_url


API_ROOT = Path(__file__).resolve().parents[2]
API_ENV_FILE = API_ROOT / ".env"


def load_api_env() -> None:
    values = dotenv_values(API_ENV_FILE)
    for key, value in values.items():
        if value is not None:
            os.environ[key] = value
    if not values.get("DATABASE_URL"):
        os.environ.pop("DATABASE_URL", None)


load_api_env()


class Settings(BaseSettings):
    app_name: str = "Wheat Raja API"
    environment: str = "development"
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "whateraja"
    database_url: str = ""
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "dev-only-wheat-raja-local-secret-change-in-env-2026"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 30
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
    razorpay_key: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    msg91_key: str = ""
    msg91_template_id: str = ""
    msg91_sender_id: str = ""
    msg91_otp_url: str = "https://control.msg91.com/api/v5/otp"
    otp_provider: str = "msg91"
    admin_phone_numbers: str = "9999999999"
    otp_dev_code: str = "246810"
    allow_dev_otp: bool = True
    csrf_protection_enabled: bool = False
    notification_provider: str = "console"
    email_provider: str = "console"
    email_fallback_provider: str = ""
    email_retry_limit: int = 2
    reminder_delivery_channels: str = "in_app,email,whatsapp"
    reminder_worker_interval_seconds: int = 60
    reminder_outbox_retry_minutes: int = 15
    reminder_outbox_max_attempts: int = 5
    sms_provider: str = "console"
    whatsapp_provider: str = "disabled"
    resend_api_key: str = ""
    resend_from_email: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    gmail_smtp_host: str = "smtp.gmail.com"
    gmail_smtp_port: int = 587
    gmail_smtp_user: str = ""
    gmail_smtp_password: str = ""
    gmail_from_email: str = ""
    aws_ses_region: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    ses_from_email: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    twilio_verify_service_sid: str = ""
    meta_whatsapp_token: str = ""
    meta_whatsapp_phone_number_id: str = ""
    interakt_api_key: str = ""
    gupshup_api_key: str = ""
    gupshup_source: str = ""
    structured_logging: bool = True
    log_level: str = "INFO"
    enforce_rbac_permissions: bool = False
    storage_provider: str = "local"
    local_upload_dir: str = "uploads"
    public_upload_base_url: str = "/uploads"
    upload_max_bytes: int = 5 * 1024 * 1024
    aws_s3_bucket: str = ""
    aws_s3_region: str = ""
    aws_s3_access_key_id: str = ""
    aws_s3_secret_access_key: str = ""
    seller_legal_name: str = "WheatRaja"
    seller_gstin: str = ""
    seller_address: str = "Noida, Uttar Pradesh"
    seller_state_code: str = "09"
    invoice_cgst_rate: float = 0
    invoice_sgst_rate: float = 0
    invoice_igst_rate: float = 0
    invoice_fiscal_year: str = "FY26-27"
    sector78_lat: float = 28.5706
    sector78_lng: float = 77.3812

    model_config = SettingsConfigDict(
        env_file=API_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return URL.create(
            "mysql+pymysql",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        ).render_as_string(hide_password=False)

    @property
    def mysql_server_url(self) -> str:
        if self.database_url:
            parsed = make_url(self.database_url)
            return str(parsed.set(database=None))
        return URL.create(
            "mysql+pymysql",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
        ).render_as_string(hide_password=False)

    @property
    def effective_db_name(self) -> str:
        if self.database_url:
            parsed = make_url(self.database_url)
            return parsed.database or self.db_name
        return self.db_name

    @property
    def sanitized_db_config(self) -> dict:
        return {
            "host": self.db_host,
            "port": self.db_port,
            "db": self.effective_db_name,
            "user": self.db_user,
            "password_length": len(self.db_password or ""),
            "has_database_url": bool(self.database_url)
        }

    @model_validator(mode="after")
    def validate_production_safety(self):
        if self.environment == "production":
            if self.jwt_secret in {"change-me", "", "dev-secret"} or len(self.jwt_secret) < 32:
                raise ValueError("Production requires a strong JWT secret of at least 32 characters.")
            if not self.razorpay_webhook_secret:
                raise ValueError("Production requires RAZORPAY_WEBHOOK_SECRET.")
            if not self.razorpay_key_id or not self.razorpay_key_secret:
                raise ValueError("Production requires Razorpay key id and secret.")
            if self.allow_dev_otp:
                raise ValueError("Production requires ALLOW_DEV_OTP=false.")
            if any(phone.strip() == "9999999999" for phone in self.admin_phone_numbers.split(",")):
                raise ValueError("Production must not include the default demo admin phone.")
            if not self.admin_phone_numbers or self.admin_phone_numbers.strip() in {"", "replace-with-admin-phone"}:
                raise ValueError("Production requires ADMIN_PHONE_NUMBERS.")
            if self.sms_provider == "console":
                raise ValueError("Production requires a real SMS provider.")
            if self.otp_dev_code == "246810":
                raise ValueError("Production must not use the development OTP code.")
            if not self.csrf_protection_enabled:
                raise ValueError("Production requires CSRF_PROTECTION_ENABLED=true.")
            if not self.enforce_rbac_permissions:
                raise ValueError("Production requires ENFORCE_RBAC_PERMISSIONS=true.")
            if self.email_provider == "console":
                raise ValueError("Production requires a real email provider.")
            email_ready = (
                self.email_provider == "resend" and self.resend_api_key and self.resend_from_email
            ) or (
                self.email_provider in {"smtp", "gmail"} and (self.smtp_host or self.gmail_smtp_host) and (self.smtp_username or self.gmail_smtp_user) and (self.smtp_password or self.gmail_smtp_password) and (self.smtp_from_email or self.gmail_from_email)
            ) or (
                self.email_provider == "ses" and self.aws_ses_region and self.aws_access_key_id and self.aws_secret_access_key and self.ses_from_email
            )
            if not email_ready:
                raise ValueError("Configured email provider is missing required credentials.")
            if self.otp_provider == "twilio" and not (self.twilio_account_sid and self.twilio_auth_token and self.twilio_verify_service_sid):
                raise ValueError("Twilio OTP provider requires account sid, auth token and verify service sid.")
            if self.otp_provider == "msg91" and not (self.msg91_key and self.msg91_template_id and self.msg91_sender_id):
                raise ValueError("MSG91 OTP provider requires MSG91_KEY, MSG91_TEMPLATE_ID and MSG91_SENDER_ID.")
            if self.sms_provider == "twilio" and not (self.twilio_account_sid and self.twilio_auth_token and self.twilio_from_number):
                raise ValueError("Twilio SMS provider requires account sid, auth token and from number.")
            if self.sms_provider == "msg91" and not (self.msg91_key and self.msg91_template_id and self.msg91_sender_id):
                raise ValueError("MSG91 SMS provider requires MSG91_KEY, MSG91_TEMPLATE_ID and MSG91_SENDER_ID.")
            if self.whatsapp_provider == "console":
                raise ValueError("Production WhatsApp provider must be disabled or a real adapter.")
            if self.whatsapp_provider == "meta" and not (self.meta_whatsapp_token and self.meta_whatsapp_phone_number_id):
                raise ValueError("Meta WhatsApp provider requires token and phone number id.")
            if self.whatsapp_provider == "interakt" and not self.interakt_api_key:
                raise ValueError("Interakt WhatsApp provider requires INTERAKT_API_KEY.")
            if self.whatsapp_provider == "gupshup" and not (self.gupshup_api_key and self.gupshup_source):
                raise ValueError("Gupshup WhatsApp provider requires key and source.")
            if self.storage_provider != "s3":
                raise ValueError("Production requires STORAGE_PROVIDER=s3.")
            if not (self.aws_s3_bucket and self.aws_s3_region and self.aws_s3_access_key_id and self.aws_s3_secret_access_key):
                raise ValueError("S3 storage provider requires bucket, region, access key and secret.")
            if not self.seller_legal_name or not self.seller_gstin or not self.seller_address or not self.seller_state_code:
                raise ValueError("Production requires seller legal name, GSTIN, address and state code.")
            if self.invoice_cgst_rate == 0 and self.invoice_sgst_rate == 0 and self.invoice_igst_rate == 0:
                raise ValueError("Production requires configured invoice GST rates.")
        return self


settings = Settings()
