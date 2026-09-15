# Wheat Raja 10/10 Rebuild Plan

## Current State Summary

Wheat Raja is currently a premium-looking prototype, not a launchable ecommerce business. The first fold has a decent visual mood, but the live product and blog detail routes fail, cart and checkout are fake, OTP accepts any code, admin is public, backend modules return placeholders, and buyer trust proof is missing.

Current score baseline:

| Area | Current Score | Target Score |
|---|---:|---:|
| UI/UX | 4/10 | 10/10 |
| Buyer trust | 3/10 | 10/10 |
| Investor readiness | 2.5/10 | 10/10 |
| Ecommerce readiness | 2/10 | 10/10 |
| Security | 2/10 | 10/10 |
| Backend readiness | 2/10 | 10/10 |
| SEO | 4/10 | 10/10 |
| Overall | 2.8/10 | 10/10 |

## 1. Executive Transformation Strategy

The transformation must move Wheat Raja from "nice concept website" to "trustworthy, conversion-ready, operations-ready D2C food platform." The brand must prove three things quickly:

1. Freshness is real: milled after order, batch/milled date, product pack proof, process proof.
2. Food trust is real: FSSAI, lab reports, hygienic facility, refund/shipping policies, verified reviews.
3. Commerce works: product detail, cart, delivery checker, OTP, payment, order tracking, subscription, admin control.

Strategic positioning:

- Category: premium fresh chakki atta for Noida/NCR homes.
- Core promise: "Milled after your order. Stone-ground. Delivered fresh."
- Differentiator versus big brands: not warehouse-stored, local freshness, transparent batch proof.
- Differentiator versus local chakkis: premium packaging, hygiene, delivery, subscription, digital order tracking.
- Differentiator versus marketplaces: fresher milling cycle, direct relationship, wallet/referral/subscription.

The rebuild should be executed in this order:

1. Fix broken routes and fake flows.
2. Build real cart, checkout, order, auth, payment, and admin services.
3. Redesign key commerce pages with real product assets.
4. Add trust proof modules.
5. Harden security and operations.
6. Expand SEO/local content.
7. Polish performance and investor-grade dashboards.

## 2. Target 10/10 Score Definition

### UI/UX 10/10

- Real wheat/chakki/roti visual assets, not generic plants.
- Mobile-first product discovery and purchase.
- PDP has sticky purchase panel, delivery checker, freshness proof, reviews, FAQs, nutrition, storage, related products.
- Checkout has low-friction OTP login, address selection, coupon, wallet, delivery charge, Razorpay, order confirmation.
- Empty, loading, error, success, and disabled states are designed.

### Buyer Trust 10/10

- FSSAI number and certificate image.
- Lab report card with downloadable PDF.
- Milled-after-order proof with batch and pack date.
- Real packaging and facility imagery.
- Founder/local Noida story.
- Verified reviews with order badge.
- Shipping/refund policy and freshness guarantee.
- Clear delivery SLA and serviceability checker.

### Investor Readiness 10/10

- Real repeat-purchase engine: subscriptions, wallet, referral, reorder.
- Admin controls for products, delivery, inventory, coupons, orders, reviews, blog.
- Analytics dashboard: revenue, repeat rate, subscription MRR, AOV, delivery zones, cohort retention.
- Operational controls and audit logs.
- SEO/content strategy for local and product-led demand.

### Ecommerce Readiness 10/10

- Product browse -> PDP -> cart -> checkout -> payment -> order confirmation -> tracking works end-to-end.
- Coupons and first-order discounts are enforced server-side.
- Inventory is reserved at checkout.
- Payment webhooks are idempotent.
- Notifications fire for order lifecycle events.

### Security 10/10

- Real OTP via Redis with expiry, attempt limit, phone rate limit.
- JWT access and refresh tokens in HttpOnly cookies.
- CSRF protection for cookie-auth mutations.
- Admin RBAC on frontend and backend.
- Strict CORS, secure headers, production docs disabled.
- Razorpay signature verification and webhook event log.
- Input validation, audit logs, safe errors.

### Backend 10/10

- No placeholder routers.
- Transaction-safe service layer.
- Pydantic schemas for every request/response.
- Order state machine.
- Inventory, coupon, wallet, subscription, referral services.
- Unit and integration tests for business rules.

### Database 10/10

- Alembic migrations.
- Decimal/paise money handling.
- Constraints, indexes, uniqueness rules.
- Wallet ledger integrity.
- Coupon usage constraints.
- Referral fraud prevention.
- Soft deletes and audit logs.

### SEO 10/10

- Unique metadata for all routes.
- Organization, LocalBusiness, Product, FAQ, Article, Breadcrumb schema.
- Local SEO pages for Noida sectors and NCR delivery.
- Product-led content clusters.
- Internal linking and canonical URLs.

### Performance 10/10

- LCP under 2.5s on mobile.
- Optimized hero video with poster fallback and no autoplay video on weak/mobile connections.
- CDN-hosted media, responsive images, lazy loading.
- Cached product/blog data.
- Database indexes and query budgets.

### Admin Dashboard 10/10

- Protected dashboard with real metrics, tables, filters, bulk actions, exports, audit trail.
- Modules: orders, products, inventory, customers, coupons, offers, delivery, subscriptions, wallet, referrals, reviews, CMS, notifications, analytics, settings.

## 3. Competitor Research Plan

Research sources and adaptation targets:

| Competitor / Reference | Best Homepage Idea | Best PDP Idea | Trust Element | Ecommerce Flow | Content Pattern | What Wheat Raja Should Adapt | Avoid |
|---|---|---|---|---|---|---|---|
| Aashirvaad | Big-brand trust, product family, Indian household familiarity | Product range clarity | FSSAI, heritage, broad recognition | Product discovery via categories | Family, nutrition, atta authority | Trust language, FSSAI proof, category education | Looking too corporate or mass-market |
| Fortune Atta | Benefit-led product promise | Clear "soft/fluffy roti" benefit | Adani/Fortune credibility | Marketplace purchase paths | Product benefit plus FAQs | Roti softness copy and FAQ depth | Generic commodity feel |
| Pillsbury Atta | Familiar household warmth | Simple pack-led product identity | Global food brand recall | Retail/product discovery | Easy family cooking language | Friendly kitchen copy | Overly playful tone |
| Organic Tattva | Organic/purity positioning | Ingredient-led cards | Organic/natural proof | Clean category ecommerce | Health education | Purity badges, ingredient transparency | Too much text density |
| Chakkizza | Fresh chakki positioning | Fresh milling story | Local freshness | Direct order CTA | Freshness-first copy | "Milled after order" proof | Under-polished local-shop look |
| Urban Chakki | Fresh local chakki model | Subscription/local delivery | Process trust | Local delivery | Daily-use staples | Delivery radius clarity | Weak brand depth |
| Anmasa | Regional atta/purity story | Product-specific grains | Ingredient quality | Simple shop flow | Natural food story | Grain sourcing story | Low visual premium feel |
| BigBasket atta category | Comparison, price, variants | Reviews, delivery promise | Marketplace trust | Fast add-to-cart | Category filters | Variant/filter UX | Marketplace clutter |
| Amazon atta category | Social proof at scale | Reviews/Q&A | Rating volume | Fast checkout | Benefit bullets | Review density and Q&A patterns | Price-war commoditization |
| Premium global D2C food | Cinematic product storytelling | Sticky buy module, subscriptions | Traceability, founder, sourcing | Polished checkout | Minimal copy, rich visuals | Editorial premium layouts | Empty luxury without proof |

Research actions before execution:

- Capture screenshots of each competitor homepage and PDP.
- Extract trust modules: certificates, reviews, claims, policies.
- Extract PDP structure: image gallery, selectors, badges, FAQ, reviews, sticky cart.
- Extract checkout patterns from marketplaces where accessible.
- Build a Figma moodboard: "big-brand trust", "fresh local proof", "premium D2C polish".

## 4. Visual Direction Upgrade Plan

### New Homepage Concept

Concept: "From Field to Fresh Roti, Milled After Your Order."

Hero should show real wheat fields, chakki stone milling, flour packing, or rotis being served. The current plant video must be replaced because it does not communicate atta, wheat, chakki, or Indian kitchen.

Hero structure:

- Full-bleed wheat/chakki video.
- Overlay: "Fresh Atta, Milled After Your Order."
- Subcopy: "Stone-ground Sharbati wheat. Packed with batch proof. Delivered fresh across Noida."
- CTAs: "Order Fresh Atta" and "Check Delivery".
- Trust row in first viewport: FSSAI, Milled Today, No Preservatives, Secure Payment.

### Video Source Strategy

Temporary licensed sources:

- Pexels search: wheat field, wheat harvest, flour milling, roti cooking.
- Pixabay video search: wheat field, flour mill, Indian cooking if available.
- Unsplash can provide poster images, not video-first.

Final shoot requirement:

- 20-30 seconds wheat field B-roll.
- Stone chakki close-up.
- Flour texture macro.
- Pack sealing shot.
- Indian home kitchen roti shot.
- Founder/facility shot.

Optimization:

- MP4/WebM variants.
- 6-8 second loop.
- Poster image for mobile.
- Disable video on reduced motion and slow connections.
- Use CDN and `preload="metadata"` or no preload.

### Product Photography / Rendering

Required assets:

- 5 KG and 10 KG pack renders for all three products.
- Pack front, angled pack, back label, nutrition panel.
- Flour texture, wheat grains, roti result.
- Batch/milled-date sticker closeup.
- Facility/chakki images.

### Component Redesign

- Product card: pack render, grain label, 5kg/10kg price toggle, delivery chip, "Add" and "View".
- PDP: gallery left, sticky purchase panel right, batch proof, benefits, nutrition, reviews, FAQs.
- Trust strip: icon + certificate proof, not just generic badges.
- Reviews: verified purchase, area, date, product, rating, short quote.
- Admin: dense SaaS-style dashboard, not marketing cards.

### Tokens

- Colors: forest #173F2F, wheat #D9A441, cream #FFF8EA, mitti #4B2F1F, leaf #4D7A39, clay #B56E3B, danger/success/info neutrals.
- Typography: editorial serif only for large brand moments; sans for controls and dashboards.
- Spacing: 4/8px scale, denser admin layout, roomy public storytelling.
- Radius: 8px cards, full-pill CTAs only.
- Motion: subtle fade/slide, cart drawer animation, PDP gallery transitions, no decorative excess.

## 5. Page-by-Page 10/10 Redesign Plan

| Page | Current | Target | Problems | New Layout / Content | Assets | Components | APIs | Acceptance Criteria |
|---|---:|---:|---|---|---|---|---|---|
| Home | 5 | 10 | Generic video, weak proof | Video hero, trust proof, freshness process, product shop, subscription, reviews, local delivery | Wheat/chakki/roti video, pack renders | Hero, trust proof, product shelf, process, reviews | products, reviews, delivery zones | Buyer can understand and start order in 5 seconds |
| Products | 4 | 10 | No filters/add | Category grid with variant quick add, filters, subscription nudge | Pack renders | ProductCard, QuickAdd, FilterBar | GET products, POST cart | Add product from listing works |
| Product Detail | 0 live | 10 | 404, fake add | Gallery, sticky buy, delivery, subscription, proof, reviews, FAQs | Product pack/gallery | PDPGallery, BuyBox, DeliveryWidget | product, cart, reviews, delivery | PDP loads, add cart works |
| Cart | 2 | 10 | Hardcoded | Cart line items, qty, remove, coupon, gift, delivery estimate | Product thumbnails | CartLine, CouponBox, GiftNotice | cart, coupons, delivery | Totals server-verified |
| Checkout | 2 | 10 | No flow | OTP, address, delivery, payment, order summary | Trust icons | CheckoutStepper | auth, address, order, payment | Paid order created |
| Blog | 4 | 9 | Thin cards | SEO category hub, topic clusters | Article thumbnails | ArticleCard, TopicNav | blogs | Internal links to products |
| Blog Detail | 0 live | 9 | 404/thin | Long-form article, schema, FAQs, product CTA | Diagrams/images | ArticleLayout | blogs | Indexed, schema valid |
| About | 4 | 10 | Generic | Founder, facility, chakki process, mission | Founder/facility photos | StoryTimeline | settings/media | Feels local and credible |
| Contact | 4 | 9 | Fake details | Real address, map, WhatsApp, form, support SLA | Map/facility | ContactCard, Form | contact/lead | Form submits, WhatsApp works |
| Delivery Checker | 3 | 10 | Button fake | Area/pincode/distance result, SLA, charges | Map visual | DeliveryChecker | delivery/check | Shows charge/SLA/error |
| Subscription | 3 | 10 | Buttons fake | Plan selector, cadence, savings, pause policy | Pack renders | PlanCard, CadenceSelector | subscriptions | Plan can be created |
| Reviews | 3 | 9 | Static repeats | Verified reviews, filters, photos, submit review | Customer photos optional | ReviewCard, ReviewForm | reviews | Only verified/approved reviews show |
| Login OTP | 2 | 10 | Fake OTP | Phone entry, OTP, resend timer, errors | Minimal | OTPForm | auth/otp | Real OTP verified |
| User Dashboard | 2 | 9 | Static | Summary cards: active order, wallet, subscription, reorder | Product thumbnails | DashboardCards | user/orders/wallet | Personalized after login |
| Orders | 2 | 9 | Static | Order list, invoice, reorder | Product thumbs | OrderList | orders | Real user orders |
| Tracking | 2 | 9 | Static | Timeline, ETA, notifications | Timeline icons | TrackingTimeline | orders/{id}/tracking | Status updates visible |
| Addresses | 2 | 9 | Static | CRUD addresses, default, serviceability | Map optional | AddressForm | addresses, delivery | Saved and validated |
| Wallet | 2 | 9 | Static | Balance, ledger, redemption rules | Ledger UI | WalletLedger | wallet | Points reconcile |
| Refer & Earn | 2 | 9 | Static | Referral code, share links, rewards | Share visuals | ReferralPanel | referrals | Code valid/no repeats |
| Profile | 2 | 9 | Static | Name, phone, preferences | None | ProfileForm | users/me | Saves profile |
| Admin Dashboard | 2 | 10 | Public/fake | KPI cards, order queue, inventory alerts, sales chart | Charts | AdminLayout, KPI | analytics | Protected and real |
| Admin Orders | 1 | 10 | Placeholder | Table, filters, status update, invoice, audit | None | DataTable, StatusMenu | admin/orders | Status updates notify user |
| Admin Products | 1 | 10 | Placeholder | CRUD products, images, SEO | Product media | ProductEditor | admin/products | Product changes reflect storefront |
| Admin Inventory | 1 | 10 | Placeholder | Variant stock, low-stock alerts | None | InventoryTable | admin/inventory | Stock reservations work |
| Admin Customers | 1 | 9 | Placeholder | Customer list, orders, wallet, addresses | None | CustomerProfile | admin/customers | Search and view detail |
| Admin Coupons | 1 | 9 | Placeholder | Create coupons, limits, usage | None | CouponEditor | admin/coupons | Server enforces coupon |
| Admin Offers | 1 | 9 | Placeholder | Free gift, first order discount | None | OfferRules | admin/offers | Offer rules editable |
| Admin Delivery | 1 | 10 | Placeholder | Radius slabs, override, zones | Map | DeliveryRules | admin/delivery | Rule changes affect checkout |
| Admin Subscriptions | 1 | 9 | Placeholder | Active plans, renewals, skips | None | SubscriptionTable | admin/subscriptions | Admin can manage plan |
| Admin Wallet | 1 | 9 | Placeholder | Activate/deactivate, ledger, manual adjustment | None | WalletControls | admin/wallet | Audited changes |
| Admin Referrals | 1 | 9 | Placeholder | Referral fraud checks, rewards | None | ReferralTable | admin/referrals | Reward once only |
| Admin Reviews | 1 | 9 | Placeholder | Moderate, approve, reject | None | ReviewModeration | admin/reviews | Only approved reviews public |
| Admin Blog CMS | 1 | 9 | Placeholder | Rich editor, SEO fields, publish | Images | BlogEditor | admin/blogs | Blog publishes to site |
| Admin Notifications | 1 | 9 | Placeholder | Templates, send log | None | NotificationCenter | admin/notifications | Events trigger messages |
| Admin Analytics | 1 | 10 | Placeholder | Revenue, AOV, retention, subscriptions, zones | Charts | AnalyticsDashboard | admin/analytics | Metrics match DB |
| Admin Settings | 1 | 9 | Placeholder | Brand, FSSAI, payment, policies | Uploads | SettingsForms | admin/settings | Settings drive frontend |

## 6. Buyer Trust Upgrade Plan

Trust modules required:

- FSSAI proof: certificate image, license number, verification copy.
- Lab test proof: latest report date, tested parameters, downloadable PDF.
- Milled-after-order proof: PDP and checkout show "Will be milled after payment" and order confirmation shows batch ID.
- Batch display: package sticker and account order detail show `batch_code`, `milled_at`, `packed_at`.
- Packaging images: real 5kg/10kg packs.
- Founder/facility story: Noida facility, chakki image, hygiene process.
- Reviews: verified purchase badge, product, sector/city, date, rating.
- WhatsApp proof: real support number, support hours, response SLA.
- Policies: refund, replacement, shipping, privacy, terms.
- Secure payment: Razorpay, UPI/cards, HTTPS, refund rules.
- Delivery SLA: "Same/next day in service zones" if operationally true.
- Local Noida trust: Sector 78 base, delivery radius, service sectors.
- Freshness guarantee: replacement if stale/damaged within defined window.

## 7. Ecommerce Flow Rebuild Plan

### Product Browse

- Frontend: list products with pack renders, price, quick add, variant toggle.
- APIs: `GET /api/products`, `GET /api/products/{slug}`.
- DB: products, variants, images, inventory.
- Validation: active products only, in-stock variant only.
- Errors: out of stock, unavailable service area.
- Tests: product listing, inactive hidden, variant price correct.

### Add to Cart

- Frontend: quick add/PDP buy box calls API, updates cart drawer and badge.
- APIs: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`.
- DB: carts, cart_items, anonymous session cart optional.
- Validation: qty positive, variant active/in stock.
- Success: toast and cart drawer.
- Tests: add, increment, remove, merge after login.

### Coupon Apply

- Frontend: coupon box with success/error.
- APIs: `POST /api/coupons/validate`.
- DB: coupons, coupon_usage.
- Validation: active, date, min order, user limits, first-order rules.
- Tests: SAVE05, expired, duplicate usage.

### Delivery Checker

- Frontend: pincode/area/distance input, result card.
- APIs: `POST /api/delivery/check`.
- DB: delivery_rules, delivery_zones, address geocode.
- Validation: numeric distance/geocoded area.
- Tests: all slabs, 60km blocked, admin override.

### Checkout / Payment / Order

- Frontend: stepper, address, summary, payment.
- APIs: `POST /api/orders/quote`, `POST /api/orders`, `POST /api/payments/razorpay/order`, `POST /api/payments/razorpay/webhook`.
- DB: orders, order_items, payments, inventory_reservations, webhook_events.
- Validation: server-side totals, stock, delivery, coupon.
- Success: order confirmation and notifications.
- Tests: total tamper blocked, webhook idempotency, failed payment.

### Subscription

- Frontend: product, variant, cadence, address, payment preference.
- APIs: `POST /api/subscriptions`, `PATCH /api/subscriptions/{id}`.
- DB: subscriptions, subscription_events.
- Validation: active product, serviceable address.
- Tests: create, pause, resume, skip, renew.

### Wallet / Referral / Reviews

- Wallet: ledger-only, points from delivered paid orders, redemption at 100+.
- Referral: generated code, one reward after referred user's first successful order.
- Reviews: verified order required, moderation before public.

### Admin Order Update

- Frontend: protected order table with status menu.
- APIs: `PATCH /api/admin/orders/{id}/status`.
- DB: orders, notifications, audit logs.
- Validation: valid transition only.
- Tests: placed -> packed -> out_for_delivery -> delivered; invalid transitions blocked.

## 8. Security Hardening Plan

Required changes:

- OTP stored in Redis as hash, TTL 5 minutes.
- OTP request rate limit: per phone and IP.
- OTP verify attempt limit: max 5 per code.
- JWT access token 15-30 minutes; refresh token 15-30 days, rotation enabled.
- HttpOnly, Secure, SameSite=Lax/Strict cookies.
- CSRF token for all cookie-auth mutations.
- `get_current_user`, `require_user`, `require_admin` dependencies.
- Frontend middleware/layout checks for `/account` and `/admin`.
- CORS exact production origin only.
- Secure headers: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- Pydantic schemas with strict input validation.
- SQLAlchemy parameterized queries only; no raw untrusted SQL.
- XSS prevention: sanitize CMS content, CSP, avoid unsafe HTML except schema JSON.
- Razorpay webhook signature verification plus event idempotency table.
- Admin audit logs for every write action.
- Production: disable `/docs`, `/redoc`, verbose errors.
- Env secrets: no defaults like `change-me`; startup should fail in production if missing.

## 9. Backend Rebuild Plan

| Module | Current Issue | Target Implementation | APIs | Services | DB | Tests |
|---|---|---|---|---|---|---|
| auth | Fake OTP | Redis OTP, JWT refresh, CSRF | otp request/verify, refresh, logout | AuthService | users, sessions/refresh_tokens | OTP expiry, rate limit |
| users | Placeholder | Profile, addresses, preferences | me, profile, addresses | UserService | users, addresses | CRUD, auth |
| products | Static seed | DB-backed catalog | list, detail, variants | ProductService | products, variants, images | active/inactive |
| cart | Placeholder | Persistent cart | cart CRUD | CartService | carts, cart_items | totals, merge |
| checkout | Missing | Quote and validation | quote | CheckoutService | cart, delivery, coupons | price tamper |
| orders | Placeholder | Order lifecycle | create/list/detail/status | OrderService | orders, items | status machine |
| payments | Partial | Razorpay order + webhook | create, webhook | PaymentService | payments, webhook_events | idempotency |
| coupons | Simple function | Rule engine | validate/admin CRUD | CouponService | coupons, usage | usage limits |
| delivery | Hardcoded | Admin rules/zones | check/rules | DeliveryService | delivery_rules,zones | slabs |
| subscriptions | Placeholder | Monthly plans | CRUD, pause, renew | SubscriptionService | subscriptions, events | renewals |
| wallet | Preview only | Ledger | balance, redeem, admin adjust | WalletService | wallet_transactions | no negative fraud |
| referrals | Public code | User-bound referral | code, apply, reward | ReferralService | referrals | reward once |
| reviews | Placeholder | Verified moderation | list/create/moderate | ReviewService | reviews | verified only |
| blogs | Placeholder | CMS | public/admin CRUD | BlogService | blog_posts | SEO fields |
| notifications | Placeholder | Event notifications | list/send | NotificationService | notifications | order events |
| admin | Public placeholder | Protected ops | module APIs | AdminService | audit_logs | RBAC |
| analytics | Missing | Metrics | revenue, orders, retention | AnalyticsService | derived queries | metric correctness |
| settings | Placeholder | Brand/config | settings CRUD | SettingsService | settings | cache invalidation |

## 10. Database Hardening Plan

Schema improvements:

- Use Alembic from day one.
- Store money in paise as integer or Decimal consistently.
- Add `order_number` unique public identifier.
- Add payment and order enums as normalized constants.
- Add positive constraints for quantity, price, inventory, points.
- Add indexes: user_id, order status, product slug, phone, referral_code, coupon code, created_at.
- Add product `deleted_at` and `active`.
- Add inventory reservations table.
- Add webhook_events table with unique provider event id.
- Add refresh_tokens or sessions table.
- Add OTP attempts in Redis, not MySQL.
- Add wallet transaction type and balance snapshots.
- Add referral code ownership and anti-self-referral constraints.
- Add review unique constraint per user/product/order item.
- Add admin audit logs with before/after JSON.
- Add settings typed values or JSON schema validation.

## 11. SEO & AI Search 10/10 Plan

Keyword clusters:

- Fresh atta delivery Noida.
- Buy atta online Noida.
- MP Sharbati atta.
- Sharbati atta for soft rotis.
- Multigrain atta benefits.
- Stone-ground atta.
- Chakki atta vs packaged atta.

Technical SEO:

- Unique metadata per page.
- Canonical URLs.
- Product schema on every PDP.
- FAQ schema on PDPs and blog FAQs.
- Article schema for blogs.
- Breadcrumb schema.
- Organization and LocalBusiness schema.
- Sitemap includes products, blogs, policies.
- Robots production-ready.
- OpenGraph images per product/blog.

Content plan:

- Product pages: 700-1000 words split into scannable modules.
- Blog clusters: freshness, wheat types, health, storage, roti softness, Noida delivery.
- Local pages: Sector 78, Noida Extension, Indirapuram, Greater Noida West if serviceable.
- AI search: answer-style sections, explicit facts, schema, FAQs, comparison tables.

## 12. Performance Plan

Targets:

- LCP under 2.5s mobile.
- CLS under 0.1.
- INP under 200ms.
- API p95 under 300ms for catalog/cart.

Actions:

- Replace remote full video with optimized CDN assets.
- Serve mobile poster instead of video by default.
- Compress hero video to short loop under 3-5MB.
- Use responsive images and explicit dimensions.
- Lazy-load below-fold images.
- Cache product/blog/settings.
- Add DB indexes and avoid N+1 queries.
- Use CDN for static media.
- Add performance budgets in QA.

## 13. Figma Execution Plan

Figma file: `https://www.figma.com/design/H5kKNB7TElyPdP5Iz6hUnK`

Execution deliverables:

1. Visual moodboard: competitor references, wheat/chakki/roti imagery, packaging direction.
2. Component library: buttons, inputs, cards, badges, tabs, tables, modals, toast, steppers.
3. Tokens: color, typography, spacing, radius, shadows, data-viz colors.
4. Homepage 10/10 design: desktop and mobile.
5. PDP 10/10 design: desktop and mobile.
6. Checkout design: OTP, address, payment, order confirmation.
7. User dashboard: overview, orders, wallet, referrals, subscriptions.
8. Admin dashboard: dense SaaS layout with real tables and KPI cards.

Acceptance criteria:

- Designs are not wireframes.
- Every section maps to a component to build.
- Mobile versions are explicit.
- Trust proof and commerce states are designed.
- Admin screens are operational, not decorative.

Note: a Figma capture ID was generated to place the current homepage as the "before" reference. Completing the capture requires temporary script injection into the local app or browser capture tooling; because this planning pass prohibits code changes, the capture should be completed in Phase 0.

## 14. Implementation Phases

### Phase 0: Research + Figma Redesign

- Goal: finalize the 10/10 visual and architectural blueprint.
- Tasks: competitor screenshots, moodboard, page designs, component library, data model review.
- Files: docs, Figma file.
- APIs: none.
- DB: none.
- UI: Figma only.
- Acceptance: approved designs and technical spec.
- Tests: design QA against mobile/desktop checklist.
- Done: all key pages ready for implementation.

### Phase 1: Fix Broken Routes and Fake Flows

- Goal: remove launch blockers.
- Tasks: fix Next dynamic params, wire PDP/blog routes, remove hardcoded cart illusions.
- Files: dynamic route pages, product/cart components.
- APIs: cart skeleton, product detail.
- DB: no major changes yet.
- UI: error states and empty cart.
- Acceptance: no 404 for intended links; add-to-cart mutates cart.
- Tests: route crawl, Playwright smoke.
- Done: product browse to cart works.

### Phase 2: Real Cart + Checkout + Order System

- Goal: buyer can place a real order.
- Tasks: cart CRUD, quote, coupon, delivery, order creation.
- APIs: cart, quote, orders.
- DB: cart/order/payment schema migrations.
- UI: cart drawer/page, checkout stepper.
- Acceptance: order created with server totals.
- Tests: coupon, delivery slabs, price tampering.
- Done: unpaid and paid order states work.

### Phase 3: OTP Auth + RBAC + Protected Admin

- Goal: secure user/admin areas.
- Tasks: Redis OTP, JWT refresh, CSRF, route guards, admin dependencies.
- APIs: auth refresh, me, protected admin.
- DB: sessions/refresh tokens if chosen.
- UI: login states, auth errors.
- Acceptance: fake OTP impossible; admin blocked for users.
- Tests: auth, rate limits, RBAC.
- Done: security baseline 8+/10.

### Phase 4: Premium Homepage + PDP Redesign

- Goal: visual and conversion upgrade.
- Tasks: new hero video, pack renders, trust modules, PDP buy box.
- APIs: products, reviews, delivery.
- DB: media/product SEO fields.
- UI: homepage/PDP.
- Acceptance: brand feels category-specific and premium.
- Tests: mobile visual QA, accessibility.
- Done: buyer trust before checkout rises materially.

### Phase 5: Trust Proof + Reviews + Policies

- Goal: trust from 3/10 to 8+/10.
- Tasks: FSSAI, lab reports, policies, verified reviews, founder/facility story.
- APIs: reviews, settings/media.
- DB: reviews, settings, media.
- UI: proof modules and policy pages.
- Acceptance: all major buyer objections answered.
- Tests: schema, review moderation.
- Done: site feels real and accountable.

### Phase 6: Admin Dashboard Real Modules

- Goal: real operations control.
- Tasks: order table, product CRUD, inventory, delivery rules, coupons, reviews, CMS.
- APIs: admin module APIs.
- DB: audit logs and module tables.
- UI: admin layout, tables, filters.
- Acceptance: admin can run daily operations.
- Tests: RBAC, audit logs, CRUD.
- Done: investor readiness 7+/10.

### Phase 7: Wallet + Referral + Subscription

- Goal: repeat purchase engine.
- Tasks: subscription lifecycle, wallet ledger, referral rewards.
- APIs: subscriptions, wallet, referrals.
- DB: ledger/referral/subscription events.
- UI: dashboard modules.
- Acceptance: repeat purchase flows work.
- Tests: fraud, reward once, redemption threshold.
- Done: retention engine operational.

### Phase 8: SEO + Blog + Schema

- Goal: organic acquisition engine.
- Tasks: metadata, schema, topic clusters, local SEO.
- APIs: CMS.
- DB: SEO fields.
- UI: blog templates, FAQ modules.
- Acceptance: schema valid and content indexable.
- Tests: sitemap, rich results, crawl.
- Done: SEO 8+/10.

### Phase 9: Performance + Security Hardening

- Goal: launch hardening.
- Tasks: media optimization, headers, docs off prod, webhook idempotency, logging.
- APIs: all.
- DB: indexes.
- UI: loading/error states.
- Acceptance: Core Web Vitals targets and security checklist pass.
- Tests: Lighthouse, OWASP, load tests.
- Done: production readiness.

### Phase 10: Final QA and Launch Readiness

- Goal: launch with confidence.
- Tasks: E2E order tests, admin tests, mobile QA, payment sandbox/live switch, backups.
- APIs: all.
- DB: migrations tested.
- UI: final polish.
- Acceptance: no P0/P1 issues.
- Tests: full regression.
- Done: 10/10 launch candidate.

## 15. Final Checklist

- [ ] Dynamic routes fixed.
- [ ] Cart is real.
- [ ] Checkout creates orders.
- [ ] Razorpay sandbox end-to-end works.
- [ ] OTP is real and rate-limited.
- [ ] Admin is protected.
- [ ] Product pack imagery added.
- [ ] Hero video is category-correct and optimized.
- [ ] FSSAI/lab/policies added.
- [ ] Delivery checker is live.
- [ ] Subscription, wallet, referral flows are real.
- [ ] Admin modules are operational.
- [ ] Migrations exist.
- [ ] Money uses paise/Decimal.
- [ ] SEO schema validates.
- [ ] Core Web Vitals pass.
- [ ] Security checklist passes.
- [ ] Final mobile/desktop visual QA passes.

