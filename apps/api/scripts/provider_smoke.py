import json
import os
import sys
from argparse import ArgumentParser

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.email_service import EmailMessagePayload, EmailService
from app.services.readiness import launch_readiness_checks
from app.services.storage import store_image


PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def parser() -> ArgumentParser:
    arg_parser = ArgumentParser(description="Run launch provider readiness checks without printing secrets.")
    arg_parser.add_argument("--send-email", action="store_true", help="Send a real provider email to SMOKE_EMAIL_TO.")
    arg_parser.add_argument("--upload-image", action="store_true", help="Upload a tiny PNG via the configured storage provider.")
    arg_parser.add_argument("--json-out", default="", help="Optional path for JSON evidence output.")
    return arg_parser


def main() -> int:
    args = parser().parse_args()
    db: Session = SessionLocal()
    try:
        checks = launch_readiness_checks(db)
        live_checks = []
        if args.send_email:
            to_email = os.environ.get("SMOKE_EMAIL_TO", "").strip()
            if not to_email:
                live_checks.append({"key": "ses_send", "ok": False, "label": "SMOKE_EMAIL_TO is required for --send-email"})
            else:
                ok = EmailService(db).send(
                    EmailMessagePayload(
                        event_type="provider_smoke",
                        to_email=to_email,
                        subject="WheatRaja provider smoke",
                        text="WheatRaja SES/email provider smoke test.",
                    )
                )
                db.commit()
                live_checks.append({"key": "ses_send", "ok": ok, "label": "SES/email provider delivered smoke message"})
        if args.upload_image:
            try:
                stored = store_image(PNG_1X1, "provider-smoke.png", "image/png")
                live_checks.append({"key": "s3_upload", "ok": stored.provider == settings.storage_provider, "label": "Storage provider accepted smoke image", "url": stored.url})
            except Exception as exc:
                live_checks.append({"key": "s3_upload", "ok": False, "label": "Storage provider accepted smoke image", "error": str(exc)})
    finally:
        db.close()

    checks.extend(live_checks)
    blockers = [check for check in checks if check.get("blocker", True) and not check["ok"]]
    result = {
        "environment": settings.environment,
        "provider_stack": {
            "payment": "razorpay",
            "email": settings.email_provider,
            "sms": settings.sms_provider,
            "whatsapp": settings.whatsapp_provider,
            "storage": settings.storage_provider,
        },
        "market_ready": not blockers,
        "blockers": blockers,
        "checks": checks,
    }
    output = json.dumps(result, indent=2)
    print(output)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as handle:
            handle.write(output + "\n")
    return 1 if blockers else 0


if __name__ == "__main__":
    sys.exit(main())
