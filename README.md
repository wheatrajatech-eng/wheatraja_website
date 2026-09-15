# Wheat Raja Commerce Platform

Production-oriented monorepo for Wheat Raja.

## Architecture

```text
apps/
  website/   Public customer ecommerce frontend, runs on port 3000
  admin/     Independent admin frontend, runs on port 3001
  api/       Shared FastAPI backend, runs on port 8000
  shared/    Shared API client, types and utilities
```

The current scalable layout is kept intentionally: `apps/website` is the customer frontend, `apps/admin` is the admin frontend, and `apps/api` is the one shared backend API. Both frontends use:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

The backend keeps both `/api/v1` and legacy `/api` routes mounted.

## Backend Database

Local MySQL target:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=whateraja
DB_USER=wheatraja_user
DB_PASSWORD=<your-local-password>
DATABASE_URL=mysql+pymysql://wheatraja_user:<url-encoded-password>@localhost:3306/whateraja
```

The password is loaded from `.env`; it is not built into source code or printed in logs. The backend uses SQLAlchemy URL handling so `@` in the password is safe. If `DATABASE_URL` is set, it is used. If not, the URL is built with `URL.create()`.

On local/dev startup, the API:

- creates MySQL database `whateraja` if missing
- runs `Base.metadata.create_all(bind=engine)`
- seeds default roles, admin user, categories, products, inventory, banners, settings, blog, delivery rules, and coupons

SQLite files in this repository are local development artifacts only. MySQL is the authoritative production target.

Alembic is already initialized under `apps/api/alembic`, with an initial schema revision. For production-style migrations:

```powershell
cd apps/api
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

## Install

From project root:

```powershell
npm install
cd apps/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Check `apps/api/.env` and confirm `DB_PASSWORD` and `DATABASE_URL` match your local MySQL credentials.

## Run

Backend from `apps/api`:

```powershell
cd apps/api
venv\Scripts\activate
py -3.11 -m uvicorn app.main:app --app-dir . --host 127.0.0.1 --port 8000
```

Backend from project root:

```powershell
$env:PYTHONPATH='apps/api'
py -3.11 -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8000
```

Customer frontend:

```powershell
npm run dev:website
```

Admin frontend:

```powershell
npm run dev:admin
```

## Commerce Lifecycle

The intended order pipeline is now:

```text
Website guest cart -> OTP login -> backend cart merge -> backend quote -> pending order
-> inventory reservation -> Razorpay order -> payment verify/webhook
-> inventory commit -> cart clear -> notification -> admin fulfillment
-> shipment events -> user tracking -> return/refund flow when needed
```

Guest `localStorage` is only a pre-login basket cache. Backend APIs are the source of truth for checkout pricing, coupons, wallet usage, order creation, payment status, inventory, returns, shipments, and notifications.

## Verify API

Open or request:

```text
http://localhost:8001/health
http://localhost:8001/health/db
http://localhost:8001/docs
http://localhost:8001/api/v1/products
http://localhost:8001/api/v1/categories
http://localhost:8001/api/v1/admin/stats
http://localhost:8001/api/v1/blogs
http://localhost:8001/api/v1/admin/readiness
```

Expected status is `200`.

## Verify Frontends

```text
http://localhost:3000
http://localhost:3001
http://localhost:3000/favicon.ico
http://localhost:3001/favicon.ico
```

Favicons should return `200`.

## Verify MySQL Tables

In MySQL Workbench:

```sql
USE whateraja;
SHOW TABLES;
```

Expected ecommerce tables include:

```text
addresses
admin_audit_logs
audit_logs
banners
blog_categories
blog_posts
blogs
cart_items
carts
categories
contacts
contact_inquiries
coupons
inventory
newsletter_subscribers
orders
order_items
payments
permissions
product_images
product_variants
products
reviews
roles
role_permissions
settings
shipments
shipment_events
inventory_reservations
returns
return_items
notification_events
stock_movements
users
user_roles
```

## Docker Local Stack

Copy `.env.example` values into real secrets before using this for anything beyond local development. The included compose file intentionally uses placeholders.

```powershell
docker compose up --build
```

Services:

```text
website http://localhost:3000
admin   http://localhost:3001
api     http://localhost:8001
mysql   localhost:3306
```

## Production Checklist

- Replace all placeholder secrets.
- Set `ENVIRONMENT=production`.
- Set strong `JWT_SECRET`.
- Set `ALLOW_DEV_OTP=false`.
- Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
- Configure MSG91 or another OTP/SMS provider.
- Run Alembic migrations against MySQL.
- Point Razorpay webhooks to `/api/v1/payments/razorpay/webhook`.
- Confirm admin phone numbers are controlled by operations.
- Run website/admin builds and backend import/compile checks.

## Windows Port Troubleshooting

Old dev servers sometimes get stuck on Windows.

Check ports:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :8000
```

Kill a stuck process:

```powershell
taskkill /PID <PID> /F /T
```

Run the API temporarily on `8001`:

```powershell
py -3.11 -m uvicorn app.main:app --app-dir apps/api --host 127.0.0.1 --port 8001
```

Point frontends at `8001`:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8001/api/v1"
npm run dev:website
```

Use the same env var before `npm run dev:admin` for the admin app.

## MySQL Auth Troubleshooting

If startup shows:

```text
Access denied for user 'root'@'localhost' (using password: YES)
```

the app is now sending a password, so the original missing-password bug is fixed. Confirm the root password in MySQL Workbench or reset it, then update `apps/api/.env`.

You can also run the local helper from an Administrator PowerShell:

```powershell
.\scripts\reset-mysql-root-password.ps1
```

Then test:

```powershell
mysql -h localhost -P 3306 -u wheatraja_user -p -e "SELECT VERSION();"
```

If it shows:

```text
using password: NO
```

the API is not loading the intended `.env`; run from the commands above or set `DATABASE_URL` explicitly in the same terminal before starting Uvicorn.
