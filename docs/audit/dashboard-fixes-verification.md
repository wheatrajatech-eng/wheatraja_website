# Dashboard fixes and verification

Date: 2026-09-14

## Implemented

- Customer and admin logout call the API, clear browser session cookies and redirect only on success. Failure stays visible.
- Tracking highlights the actual stage across placed, milling, packed, shipped, out-for-delivery and delivered. Non-fulfilment states have a separate notice.
- Shared admin and customer layout constraints prevent document-width overflow. Navigation and wide tables scroll inside their containers on small screens.
- Admin subscription management supports creation, edits, pause/resume/cancel, skipping, vacation holds and cycle generation.
- Reviews support approval and deletion. Contact supports status changes and guarded deletion. Users support account creation, roles and blocking with self-lockout safeguards.
- Support supports status, priority and resolution notes. Recoveries support recording follow-ups, dismissal and reopening, without implying a message was sent.
- Delivery slots support creation, edits, deactivation and guarded deletion. Booked slots cannot be deleted or moved.
- Authentication checks persisted user role and blocked state. Session reads cannot re-promote demoted users from stale JWT claims.
- Subscription updates synchronize pending deliveries and cancel pending reminders for inactive plans. Cycle generation reserves inventory and applies eligible wallet funds.
- Return transitions are guarded and restocking is idempotent. Refund completion requires a recorded refund state.
- Product variant creation no longer flushes a missing required price. Coupon quick-create uses the correct API contract. Inventory/return editors no longer claim success without a selected record.
- Customer support and cancellation/return flows show request failures. Paid-order online cancellation is not offered where refund review is required.

## Verification evidence

- `npm run test:api -- -q --tb=short --show-capture=no`: **155 passed**, three dependency/lifespan deprecation warnings.
- `npm run build`: website and admin production builds and TypeScript checks passed.
- `scripts/dashboard-page-audit.cjs`: **46 routes, 276 viewport checks** at 320, 390, 768, 1024, 1440 and 1920 pixels. No document overflow, captured JavaScript errors or API failures in that audit. See `dashboard-responsive/results.json` and screenshots.
- `scripts/dashboard-action-audit.cjs`: **11 browser scenario groups passed** against the real API with disposable SQLite data. See `dashboard-actions/results.json`.
- Browser scenarios cover all six tracking highlights, customer support creation, admin support resolution, review approval/deletion, subscription edit/pause, delivery-slot creation, contact status, recovery follow-up, user creation and both logouts.
- API tests additionally cover catalog/category/coupon/banner actions, subscription skip/vacation/cancellation and cycle funding/inventory, return transitions/restocking, unpaid cancellation, profile/address actions, notification reads, blocked/demoted accounts, restricted staff and customer denial on registered admin mutations.

## Remaining release blockers and limits

This is not a certification that every workflow is production-ready.

- **Wallet recharge remains unsafe:** `/wallet/recharge` currently credits the supplied amount without a verified provider payment. Do not expose this capability in production until a verified, idempotent payment-credit flow replaces it.
- External payment deductions/refunds, email/WhatsApp delivery and recurring production worker execution were not live-tested. Tests send no real customer messages and use no production data.
- Role-denial coverage does not prove every combination of every configured staff role. Deployment must enable RBAC enforcement and review actual role grants.
- Page rendering and selected browser mutation tests are not exhaustive coverage of every possible CRUD action, failure mode, browser or screen size. Profile/address/subscription UI network-error handling still needs further hardening.
- SQLite checks do not establish production-database concurrency guarantees or load-test performance.
- No Git repository exists in this workspace; changes have not been committed or pushed.

## Reproduction

Run the API suite and production build using the commands above. With local ports 8001, 3100 and 3101 free, run `node scripts/dashboard-action-audit.cjs` and `node scripts/dashboard-page-audit.cjs`. These scripts launch the isolated audit API rather than the live database. Never deploy the audit server or its synthetic-session endpoint.
