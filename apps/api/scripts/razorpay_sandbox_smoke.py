import json
import os
import sys
from argparse import ArgumentParser

from app.services.razorpay_provider import RazorpayProvider


def parser() -> ArgumentParser:
    arg_parser = ArgumentParser(description="Validate Razorpay sandbox/live credentials against supplied sandbox ids.")
    arg_parser.add_argument("--payment-id", default=os.environ.get("RAZORPAY_SMOKE_PAYMENT_ID", ""), help="Captured sandbox payment id to fetch.")
    arg_parser.add_argument("--refund-id", default=os.environ.get("RAZORPAY_SMOKE_REFUND_ID", ""), help="Optional refund id to fetch.")
    arg_parser.add_argument("--json-out", default="", help="Optional path for JSON evidence output.")
    return arg_parser


def main() -> int:
    args = parser().parse_args()
    provider = RazorpayProvider()
    checks = []

    if not provider.configured():
        checks.append({"key": "razorpay_credentials", "ok": False, "label": "Razorpay key id and secret configured"})
    else:
        checks.append({"key": "razorpay_credentials", "ok": True, "label": "Razorpay key id and secret configured"})

    if args.payment_id:
        try:
            payment = provider.fetch_payment(args.payment_id)
            checks.append(
                {
                    "key": "payment_fetch",
                    "ok": payment.get("status") == "captured",
                    "label": "Razorpay payment fetch returns captured status",
                    "payment_id": payment.get("id"),
                    "status": payment.get("status"),
                    "amount": payment.get("amount"),
                    "order_id": payment.get("order_id"),
                }
            )
        except Exception as exc:
            checks.append({"key": "payment_fetch", "ok": False, "label": "Razorpay payment fetch returns captured status", "error": str(exc)})
    else:
        checks.append({"key": "payment_fetch", "ok": False, "label": "Provide --payment-id or RAZORPAY_SMOKE_PAYMENT_ID"})

    if args.refund_id:
        try:
            refund = provider.client().refund.fetch(args.refund_id)
            checks.append(
                {
                    "key": "refund_fetch",
                    "ok": refund.get("status") in {"processed", "pending"},
                    "label": "Razorpay refund fetch works",
                    "refund_id": refund.get("id"),
                    "status": refund.get("status"),
                    "payment_id": refund.get("payment_id"),
                }
            )
        except Exception as exc:
            checks.append({"key": "refund_fetch", "ok": False, "label": "Razorpay refund fetch works", "error": str(exc)})
    else:
        checks.append({"key": "refund_fetch", "ok": True, "label": "Refund id not supplied; run after refund webhook smoke", "skipped": True})

    blockers = [check for check in checks if not check["ok"]]
    result = {"market_ready_payment_provider": not blockers, "blockers": blockers, "checks": checks}
    output = json.dumps(result, indent=2)
    print(output)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as handle:
            handle.write(output + "\n")
    return 1 if blockers else 0


if __name__ == "__main__":
    sys.exit(main())
