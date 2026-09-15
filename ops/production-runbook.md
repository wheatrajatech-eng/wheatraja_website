# Wheat Raja Production Runbook

## Preflight

- Set `ENVIRONMENT=production`.
- Set `CSRF_PROTECTION_ENABLED=true`.
- Set `ENFORCE_RBAC_PERMISSIONS=true` after seeding roles and permissions.
- Configure Razorpay key id, key secret and webhook secret.
- Configure `EMAIL_PROVIDER=ses`, `SMS_PROVIDER=msg91`, and `STORAGE_PROVIDER=s3`.
- Set `WHATSAPP_PROVIDER=disabled` unless Meta, Interakt, or Gupshup credentials are live.
- Configure seller legal name, GSTIN, address, state code, fiscal year and GST rates.
- Confirm every active product has `hsn_code` and `gst_rate`.
- Restrict `ALLOWED_ORIGINS` to the production website and admin origins.
- Disable development OTP, replace `OTP_DEV_CODE`, and remove the demo admin phone.

## Deploy

1. Build images with the checked-in Dockerfiles.
2. Run `scripts/mysql-backup.ps1` before migrations.
3. Run `scripts/migrate-production.ps1`.
4. Start API, website and admin containers.
5. Verify `/health`, `/health/db` and `/ready`.
6. Verify admin `/readiness`.
7. Run `npm run test:providers` with production-like secrets in staging.

## Launch Evidence Commands

Run these in staging with real staging secrets loaded into the environment:

1. `npm run test:api`
2. `npm run build`
3. `npm run preflight:launch`
4. `npm run test:providers:live`
5. `npm run test:razorpay` after setting `RAZORPAY_SMOKE_PAYMENT_ID` and optionally `RAZORPAY_SMOKE_REFUND_ID`.
6. `npm run drill:backup`
7. `curl https://staging-api.example.com/ready`

Evidence files should be saved under `docs/audit/`:

- `launch-preflight-latest.json`
- `provider-smoke-latest.json`
- `razorpay-smoke-latest.json`
- `backup-restore-drill-latest.json`

## Rollback

1. Stop new traffic at the load balancer.
2. Roll back containers to the previous image tag.
3. Restore database only when the failed deployment performed destructive data changes.
4. Use `scripts/mysql-restore.ps1 -BackupFile <path>` for restore.
5. Re-run `/ready` and one manual checkout smoke test.

## Minimum Launch Smoke Test

- Customer signup/login with OTP.
- Product add to cart.
- Checkout creates backend order.
- Razorpay sandbox payment verifies.
- Inventory reservation commits.
- Admin sees order.
- Admin creates shipment and event.
- Customer sees tracking event.
- Admin initiates sandbox refund.
- Webhook replay returns duplicate.
- Invoice PDF contains fiscal invoice number, GSTIN, HSN and GST split.
- Backup and restore scripts complete a drill against a non-production database.

## GO Criteria

- `/ready` returns `status: "ready"` and `market_ready: true`.
- The demo admin phone `9999999999` is absent from production env and blocked/removed from production database.
- Razorpay sandbox payment fetch reports `captured`.
- SES email and S3 upload smoke checks pass.
- MSG91 OTP login is manually verified.
- Backup restore drill evidence exists and says `result: "passed"`.
