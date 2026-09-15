import logging
import time
import uuid
import threading
from fastapi import Request

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from app.api import admin, auth, banners, blogs, cart, categories, contact, contacts, coupons, delivery, growth, inventory, invoices, media, newsletter, notifications, orders, payments, products, referrals, returns, reviews, settings, shipments, subscriptions, users, wallet, wishlist
from app.api import reminders
from app.core.bootstrap import initialize_application_storage
from app.core.database import engine
from app.core.database import SessionLocal
from app.models import entities  # noqa: F401
from app.core.config import settings as app_settings
from app.core.logging import configure_logging
from app.services.readiness import launch_readiness_checks
from app.services.reminders import process_due_reminders, process_reminder_outbox

configure_logging(app_settings.log_level, app_settings.structured_logging)
logger = logging.getLogger("wheatraja.api")
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=app_settings.app_name,
    version="1.0.0",
    docs_url=None if app_settings.environment == "production" else "/docs",
    redoc_url=None if app_settings.environment == "production" else "/redoc",
    openapi_url=None if app_settings.environment == "production" else "/openapi.json"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in app_settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

_reminder_worker_started = False


def start_reminder_worker() -> None:
    global _reminder_worker_started
    if _reminder_worker_started:
        return
    _reminder_worker_started = True

    def run() -> None:
        while True:
            db = SessionLocal()
            try:
                process_due_reminders(db)
                process_reminder_outbox(db)
            except Exception:
                logger.exception("reminder_worker_failed")
                db.rollback()
            finally:
                db.close()
            time.sleep(getattr(app_settings, "reminder_worker_interval_seconds", 60))

    thread = threading.Thread(target=run, name="reminder-worker", daemon=True)
    thread.start()


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.razorpay.com")
    if app_settings.environment == "production":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response


@app.middleware("http")
async def request_observability(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    correlation_id = request.headers.get("x-correlation-id") or request_id
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_error",
            extra={"request_id": request_id, "correlation_id": correlation_id, "method": request.method, "path": request.url.path, "event": "http.error"},
        )
        raise
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Correlation-ID"] = correlation_id
    logger.info(
        "request_complete",
        extra={
            "request_id": request_id,
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "event": "http.request",
        },
    )
    return response


@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    if app_settings.csrf_protection_enabled and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        if request.url.path.startswith(("/api/", "/api/v1/")) and not request.url.path.endswith(("/auth/otp/request", "/auth/signup/request", "/auth/otp/verify", "/auth/csrf", "/payments/razorpay/webhook")):
            csrf_cookie = request.cookies.get("wr_csrf")
            csrf_header = request.headers.get("x-csrf-token")
            if request.cookies.get("wr_access") and (not csrf_cookie or csrf_cookie != csrf_header):
                from fastapi.responses import JSONResponse

                return JSONResponse(status_code=403, content={"detail": "CSRF token missing or invalid"})
    return await call_next(request)

for router in [
    auth.router, users.router, products.router, categories.router, cart.router, orders.router, payments.router, media.router, invoices.router, contact.router,
    contacts.router, newsletter.router, banners.router, growth.router, inventory.router,
    coupons.router, delivery.router, subscriptions.router, wallet.router, referrals.router,
    reviews.router, blogs.router, notifications.router, shipments.router, returns.router, reminders.router,
    wishlist.router, admin.router, settings.router
]:
    app.include_router(router, prefix="/api")
    app.include_router(router, prefix="/api/v1")

if app_settings.storage_provider == "local":
    upload_path = app_settings.local_upload_dir
    if not upload_path.startswith(("/", "\\")) and ":" not in upload_path:
        from app.core.config import API_ROOT

        upload_path = str(API_ROOT / upload_path)
    app.mount(app_settings.public_upload_base_url, StaticFiles(directory=upload_path, check_dir=False), name="uploads")


@app.on_event("startup")
def create_tables() -> None:
    logger.info("API startup database config=%s", app_settings.sanitized_db_config)
    initialize_application_storage()
    start_reminder_worker()


@app.get("/health")
def health():
    return {"status": "ok", "service": app_settings.app_name}


@app.get("/health/db")
def health_db():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "database": app_settings.effective_db_name,
        "host": app_settings.db_host,
        "user": app_settings.db_user
    }


@app.get("/ready")
def readiness():
    db = SessionLocal()
    try:
        checks = launch_readiness_checks(db)
    finally:
        db.close()
    market_ready = all(row["ok"] for row in checks if row.get("blocker", True))
    return {
        "status": "ready" if market_ready else "not_ready",
        "market_ready": market_ready,
        "environment": app_settings.environment,
        "checks": checks,
    }
