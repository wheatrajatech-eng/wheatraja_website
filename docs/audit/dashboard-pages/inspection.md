# Dashboard Page Inspection

Inspection date: 2026-09-14.

46 authenticated routes were opened against production frontend builds and the real API with disposable in-memory sample data. Customer routes used a customer session; admin routes used an admin session. Application startup workers were disabled. No live customer data, payments, or outbound notifications were used.

All 46 routes returned HTTP 200, with successful observed page-data requests and no uncaught browser JavaScript errors. This verifies loading and data integration, not every mutation, failure state, permission combination, external provider, or production configuration.

## Confirmed Issues

1. Wallet recharge adds spendable credit without payment verification: `apps/api/app/api/wallet.py`, `recharge`. The customer button directly calls this endpoint. This is a production blocker.
2. Customer dashboard Sign Out is only a link to `/login`, with no logout request: `apps/website/components/account-dashboard-client.tsx`. The session remains valid.
3. Customer tracking highlights the first stage regardless of order status: `apps/website/components/account-orders-client.tsx`, `index === 0`. This is not a reliable progress indicator.
4. At a 390px viewport, all 33 admin routes overflow horizontally. A representative screenshot is `admin-_dashboard.png`. The screenshot is 3922px wide despite the 390px viewport.
5. The customer dashboard also overflows on mobile. Its mobile navigation renders only `nav.slice(0, 6)`; remaining dashboard shortcuts are omitted.
6. The admin Blogs page also overflows at a 1440px desktop viewport.

No application code was changed during this inspection. The new scripts are local audit utilities only.

## User Pages

| Route | Load/API | Inspection note |
| --- | --- | --- |
| /account | Pass | Logout and mobile navigation/layout issues |
| /account/addresses | Pass | Address display verified; saving not exercised in this pass |
| /account/notifications | Pass | Sample notification rendered |
| /account/orders | Pass | Sample order rendered; cancel/return not exercised |
| /account/orders/[orderId] | Pass | Sample order and shipment loaded |
| /account/profile | Pass | Profile loaded; saving not exercised |
| /account/refer | Pass | Referral code loaded |
| /account/reminders | Pass | Sample reminder rendered |
| /account/subscriptions | Pass | Sample plan rendered; every plan action not exercised |
| /account/support | Pass | Ticket list loaded; submission not exercised |
| /account/tracking | Pass | Progress stages are hard-coded |
| /account/wallet | Pass | Recharge credits funds without verified payment |
| /account/wishlist | Pass | Empty-state rendering verified |

## Admin Pages

Every admin page below has the shared mobile overflow issue. Pass means the page and its observed data requests loaded, not that all actions are certified.

| Route | Load/API | Additional note |
| --- | --- | --- |
| /dashboard | Pass | Sample metrics and order rendered |
| /products | Pass | Catalog rendered |
| /categories | Pass | Category list rendered |
| /orders | Pass | Sample order rendered |
| /customers | Pass | Customer list rendered |
| /customers/[phone] | Pass | Sample customer profile rendered |
| /payments | Pass | Empty-state/data request verified |
| /refunds | Pass | Empty-state/data request verified |
| /returns | Pass | Empty-state/data request verified |
| /inventory | Pass | Seed inventory rendered |
| /shipments | Pass | Sample shipment rendered |
| /coupons | Pass | Seed coupons rendered |
| /subscriptions | Pass | Records view; no management form in this page |
| /wallet | Pass | Records and adjustment form loaded |
| /banners | Pass | Seed banner rendered |
| /blogs | Pass | Also overflows on desktop |
| /reviews | Pass | Records view |
| /contact | Pass | Records view |
| /reports | Pass | Analytics loaded |
| /settings | Pass | Registry and reminder channel controls loaded |
| /users | Pass | Records view |
| /roles | Pass | Roles list and creation form loaded |
| /notifications | Pass | Events and send form loaded; external delivery not tested |
| /reminder-outbox | Pass | Sample outbox row rendered |
| /reminder-outbox/failed | Pass | Sample failed row rendered |
| /audit | Pass | Records view |
| /referrals | Pass | Records and reward form loaded |
| /support | Pass | Records view |
| /recoveries | Pass | Records view |
| /loyalty | Pass | Seed tiers loaded |
| /delivery-slots | Pass | Records view |
| /tasks | Pass | Task data loaded |
| /readiness | Pass | Endpoint renders; does not imply production readiness |

## Evidence

- `results.json`: route, HTTP status, observed API calls, headings, browser errors, desktop/mobile overflow checks.
- Adjacent PNGs: full-page mobile screenshots for each route.
- `scripts/dashboard-page-audit.cjs`: browser inspection runner.
- `scripts/dashboard-audit-api.py`: real API with isolated sample data and no startup worker.
- Prior verification: 72 API tests passed and both production builds passed. Prior focused fixture browser test covered reminder filtering, CSV contents, timeline, profile navigation, and single retry. Those checks do not negate the layout and business-logic defects found here.

Verdict: page loading and data integration pass for all 46 inspected routes. The dashboards cannot honestly be marked 100% functional or production-ready until the confirmed issues and remaining action/provider checks are addressed.
