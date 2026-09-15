from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Permission, Product, RolePermission


REQUIRED_PERMISSION_KEYS = {
    "orders:read", "orders:write", "products:read", "products:write", "customers:read",
    "coupons:write", "delivery:write", "reviews:moderate", "settings:write", "analytics:read",
    "wallet.adjust", "payments.refund", "payments.manual", "exports.read", "rbac.write",
    "inventory.write", "shipments.write", "returns.write", "notifications.write",
    "cms.write", "users.write", "referrals.write", "inventory.adjust", "returns.decide",
    "subscriptions.write",
}


def provider_configured(provider: str, requirements: dict[str, bool]) -> bool:
    return bool(provider and provider != "console" and all(requirements.values()))


def launch_readiness_checks(db: Session) -> list[dict]:
    checks: list[dict] = []

    def add(key: str, ok: bool, label: str, blocker: bool = True) -> None:
        checks.append({"key": key, "ok": bool(ok), "label": label, "blocker": blocker})

    try:
        db.execute(text("SELECT 1"))
        add("database", True, "Database connection healthy")
    except Exception:
        add("database", False, "Database connection healthy")

    missing_product_tax = db.query(Product).filter(
        Product.active == True,
        ((Product.hsn_code == None) | (Product.hsn_code == "") | (Product.gst_rate == None)),
    ).count()
    existing_permissions = {row.key for row in db.query(Permission).all()}
    missing_permissions = REQUIRED_PERMISSION_KEYS - existing_permissions
    role_permission_count = db.query(RolePermission).count()
    repo_root = Path(__file__).resolve().parents[4]

    add("razorpay", bool(settings.razorpay_key_id and settings.razorpay_key_secret and settings.razorpay_webhook_secret), "Razorpay key, secret and webhook secret configured")
    add("email", provider_configured(settings.email_provider, {
        "ses": settings.email_provider != "ses" or bool(settings.aws_ses_region and settings.aws_access_key_id and settings.aws_secret_access_key and settings.ses_from_email),
        "smtp": settings.email_provider not in {"smtp", "gmail"} or bool((settings.smtp_host or settings.gmail_smtp_host) and (settings.smtp_username or settings.gmail_smtp_user) and (settings.smtp_password or settings.gmail_smtp_password) and (settings.smtp_from_email or settings.gmail_from_email)),
        "resend": settings.email_provider != "resend" or bool(settings.resend_api_key and settings.resend_from_email),
    }), "Real email provider configured")
    add("sms", settings.sms_provider != "console" and (
        (settings.sms_provider == "msg91" and bool(settings.msg91_key and settings.msg91_template_id and settings.msg91_sender_id))
        or (settings.sms_provider == "twilio" and bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number))
    ), "Real SMS/OTP provider configured")
    add("whatsapp", settings.whatsapp_provider == "disabled" or (
        (settings.whatsapp_provider == "meta" and bool(settings.meta_whatsapp_token and settings.meta_whatsapp_phone_number_id))
        or (settings.whatsapp_provider == "interakt" and bool(settings.interakt_api_key))
        or (settings.whatsapp_provider == "gupshup" and bool(settings.gupshup_api_key and settings.gupshup_source))
    ), "WhatsApp disabled or real provider configured")
    add("storage", settings.storage_provider == "s3" and bool(settings.aws_s3_bucket and settings.aws_s3_region and settings.aws_s3_access_key_id and settings.aws_s3_secret_access_key), "S3-compatible media storage configured")
    add("csrf", settings.csrf_protection_enabled or settings.environment != "production", "CSRF protection enabled for production")
    add("dev_otp", not (settings.environment == "production" and settings.allow_dev_otp), "Development OTP disabled in production")
    add("admin_seed", "9999999999" not in {phone.strip() for phone in settings.admin_phone_numbers.split(",")}, "Default demo admin phone absent")
    add("rbac", settings.enforce_rbac_permissions or settings.environment != "production", "Strict RBAC enabled for production")
    add("rbac_permissions", not missing_permissions and role_permission_count > 0, "Required RBAC permissions seeded")
    add("seller_gst", bool(settings.seller_legal_name and settings.seller_gstin and settings.seller_address and settings.seller_state_code), "Seller GST/legal details configured")
    add("product_tax", missing_product_tax == 0, "Active products have HSN and GST rate")
    add("invoice_tax_rates", settings.invoice_cgst_rate != 0 or settings.invoice_sgst_rate != 0 or settings.invoice_igst_rate != 0, "Invoice GST rates configured")
    add("backups", (repo_root / "scripts" / "mysql-backup.ps1").exists() and (repo_root / "scripts" / "mysql-restore.ps1").exists(), "Backup and restore scripts present")
    add("cors", bool(settings.allowed_origins), "CORS origins configured")
    return checks
