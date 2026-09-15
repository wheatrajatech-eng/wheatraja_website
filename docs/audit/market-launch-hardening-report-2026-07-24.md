# WheatRaja Market Launch Hardening Report - 2026-07-24

## Executive Decision

Recommendation: NO-GO for public market launch until real production credentials, seller GST data, provider sandbox/live smoke tests, and backup/restore drills are completed.

The codebase is substantially harder now: production fails closed on unsafe defaults, payments require captured Razorpay status, admin mutations are permission-scoped, invoices support fiscal sequencing and product HSN/GST lines, readiness reports concrete blockers, and automated coverage was expanded. This is now much closer to launch, but not honestly 100% market-ready without external provider and compliance proof.

## Files Modified

- `apps/api/app/core/config.py`
- `apps/api/app/main.py`
- `apps/api/app/models/entities.py`
- `apps/api/app/api/admin.py`
- `apps/api/app/api/auth.py`
- `apps/api/app/api/payments.py`
- `apps/api/app/api/products.py`
- `apps/api/app/api/orders.py`
- `apps/api/app/api/coupons.py`
- `apps/api/app/api/blogs.py`
- `apps/api/app/api/banners.py`
- `apps/api/app/api/categories.py`
- `apps/api/app/api/settings.py`
- `apps/api/app/api/reviews.py`
- `apps/api/app/api/wallet.py`
- `apps/api/app/api/notifications.py`
- `apps/api/app/api/delivery.py`
- `apps/api/app/api/referrals.py`
- `apps/api/app/api/media.py`
- `apps/api/app/api/subscriptions.py`
- `apps/api/app/api/contacts.py`
- `apps/api/app/api/users.py`
- `apps/api/app/services/store.py`
- `apps/api/app/services/invoices.py`
- `apps/api/app/services/storage.py`
- `apps/api/app/services/readiness.py`
- `apps/api/.env.example`
- `apps/admin/components/admin-login.tsx`
- `apps/website/components/checkout-client.tsx`
- `apps/api/tests/test_launch_completion.py`
- `apps/api/tests/test_market_launch_hardening.py`
- `docker-compose.yml`
- `package.json`
- `scripts/smoke-test.cjs`
- `ops/production-runbook.md`

## Files Created

- `apps/api/alembic/versions/20260724_0011_market_launch_hardening.py`
- `apps/api/scripts/provider_smoke.py`
- `docs/audit/market-launch-hardening-report-2026-07-24.md`

## Improvements Delivered

- Production config now rejects dev OTP, demo admin phone, console providers, local storage, weak/missing payment secrets, disabled CSRF, permissive RBAC, and missing seller GST data.
- `/ready` and admin readiness now share machine-readable launch checks for providers, RBAC, product tax metadata, GST, storage, backups, CORS, CSRF, and demo safety.
- Razorpay verification now requires `captured` and returns idempotent duplicate success without repeating side effects.
- Product schema supports `hsn_code` and `gst_rate`; active products without these block readiness.
- Invoices now use fiscal sequential numbers and include HSN/GST rate/tax split line data.
- Admin mutation routes are scoped with RBAC permissions instead of broad admin checks.
- Admin login no longer pre-fills the demo phone.
- Upload validation now checks image signatures, size, MIME and safe filenames.
- Checkout empty state now links users back to products.
- Smoke test now fails if a fake admin cookie reaches the command center.
- Package scripts now include API, provider, smoke and launch test commands.

## Verification

- Backend tests: 18 passed.
- Website production build: passed.
- Admin production build: passed.
- Alembic current: `20260724_0011 (head)`.
- Alembic check: no new upgrade operations detected.

## Remaining Provider Integrations

- Razorpay must be validated with sandbox and then live credentials.
- MSG91 OTP/SMS must be validated with real template, sender and route approval.
- Amazon SES identity/domain must be verified and moved out of sandbox if required.
- S3 bucket/CDN permissions must be validated with production uploads.
- WhatsApp can remain disabled; if required for launch, Meta/Interakt/Gupshup credentials and templates must be configured and tested.

## Remaining Technical Debt And Risks

- No live credential smoke test has been run in this workspace.
- Backup/restore scripts exist but a restore drill result is not recorded here.
- Admin UI can expose more RBAC-aware affordances, but backend enforcement now exists.
- Payment webhooks are verified and replay-protected, but real Razorpay replay testing still needs sandbox payloads.
- Invoice/GST correctness must be reviewed by the merchant/accountant before paid launch.
- Docker Compose still uses placeholder secrets and must be converted to real environment-managed secrets before deployment.

## Completion Scores

- Website: 91%
- User Dashboard: 88%
- Admin Dashboard: 89%
- Backend: 92%
- Database: 91%
- Security: 86%
- Performance: 84%
- Observability: 87%
- QA: 82%
- DevOps: 78%
- Overall: 87%

## Launch Blockers

1. Real production/staging secrets are not configured or proven by provider smoke tests.
2. Merchant GSTIN, legal seller data, HSN codes and GST rates need business/accounting approval.
3. Backup and restore drill must be executed and recorded.
4. Razorpay sandbox checkout, webhook replay and refund lifecycle must be manually verified against real sandbox credentials.
5. Production hosting must inject secrets securely and pass `/ready` with `market_ready=true`.

Final recommendation: NO-GO for public market traffic today. GO is reasonable after the five launch blockers above are closed and the readiness endpoint passes in a production-like environment.
