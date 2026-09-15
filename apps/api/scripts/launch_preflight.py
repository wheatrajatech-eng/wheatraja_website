import json
import sys
from argparse import ArgumentParser

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.entities import Product, User
from app.services.readiness import launch_readiness_checks


DEMO_ADMIN_PHONE = "9999999999"


def parser() -> ArgumentParser:
    arg_parser = ArgumentParser(description="Verify launch blockers and optionally remove demo admin risk.")
    arg_parser.add_argument("--remove-demo-admin", action="store_true", help="Soft-block the demo admin user if present.")
    arg_parser.add_argument("--json-out", default="", help="Optional path for JSON evidence output.")
    return arg_parser


def product_tax_gaps(db: Session) -> list[dict]:
    rows = (
        db.query(Product)
        .filter(Product.active == True)
        .filter((Product.hsn_code == None) | (Product.hsn_code == "") | (Product.gst_rate == None))
        .order_by(Product.slug.asc())
        .all()
    )
    return [{"slug": row.slug, "name": row.name, "hsn_code": row.hsn_code, "gst_rate": float(row.gst_rate) if row.gst_rate is not None else None} for row in rows]


def main() -> int:
    args = parser().parse_args()
    db: Session = SessionLocal()
    actions: list[dict] = []
    try:
        demo_admin = db.query(User).filter_by(phone=DEMO_ADMIN_PHONE).first()
        if args.remove_demo_admin and demo_admin:
            demo_admin.blocked = True
            demo_admin.admin_notes = "Blocked by launch preflight because this is the demo admin phone."
            actions.append({"action": "blocked_demo_admin", "phone": DEMO_ADMIN_PHONE})
            db.commit()

        checks = launch_readiness_checks(db)
        gaps = product_tax_gaps(db)
    finally:
        db.close()

    blockers = [check for check in checks if check.get("blocker", True) and not check["ok"]]
    result = {
        "environment": settings.environment,
        "market_ready": not blockers,
        "demo_admin_phone_in_env": DEMO_ADMIN_PHONE in {phone.strip() for phone in settings.admin_phone_numbers.split(",")},
        "actions": actions,
        "product_tax_gaps": gaps,
        "blockers": blockers,
        "checks": checks,
    }
    output = json.dumps(result, indent=2)
    print(output)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as handle:
            handle.write(output + "\n")
    return 1 if blockers or gaps else 0


if __name__ == "__main__":
    sys.exit(main())
