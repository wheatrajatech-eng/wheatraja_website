"""Local inspection server: real API, disposable in-memory data, no workers."""
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta
from threading import Lock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps/api"))
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.config import settings
from app.core.database import Base, get_db
from app.models.entities import User, Order, OrderItem, ProductVariant, Subscription, Shipment, ReminderSchedule, ReminderDeliveryOutbox, Address, WalletTransaction, Notification
from app.services.store import ensure_seed_data, get_or_create_user
from app.models.entities import Contact, AbandonedCartRecovery

settings.allowed_origins = "http://localhost:3100,http://localhost:3101"
settings.environment = "development"
settings.email_provider = "console"
settings.whatsapp_provider = "disabled"
settings.sms_provider = "console"
settings.admin_phone_numbers = "9000000001"
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine, autoflush=False)
with Session() as db:
    ensure_seed_data(db)
    customer = get_or_create_user(db, "9000000002", "customer")
    customer.name = "Audit Customer"
    customer.email = "audit@example.invalid"
    customer.profile_complete = True
    variant = db.query(ProductVariant).first()
    order = Order(user_id=customer.id, order_number="WRAUDIT1", customer_phone=customer.phone, address_text="Audit house, Noida", status="placed", payment_status="paid", subtotal=250, total=250, payable_amount=250)
    db.add(order)
    db.flush()
    db.add_all([
        Contact(name="Audit Customer", phone=customer.phone, message="Audit contact request", status="new"),
        AbandonedCartRecovery(user_id=customer.id, phone=customer.phone, session_id="audit", cart_json="[]", subtotal=250, status="open"),
        OrderItem(order_id=order.id, variant_id=variant.id, quantity=1, unit_price=250),
        Shipment(order_id=order.id, status="packed", provider="audit", tracking_number="AUDIT1"),
        Address(user_id=customer.id, label="Home", line1="Audit house, Noida", pincode="201301"),
        WalletTransaction(user_id=customer.id, amount=100, reason="audit", transaction_type="credit"),
        Notification(user_id=customer.id, channel="in_app", title="Audit reminder", body="Test account notification", read=False),
        Subscription(user_id=customer.id, variant_id=variant.id, quantity=1, next_delivery_at=datetime.utcnow() + timedelta(days=20)),
    ])
    schedule = ReminderSchedule(user_id=customer.id, order_id=order.id, schedule_key="audit:reorder", kind="reorder", status="failed", reminder_at=datetime.utcnow(), payload_json=json.dumps({"message": "Audit refill reminder"}))
    db.add(schedule)
    db.flush()
    db.add(ReminderDeliveryOutbox(reminder_schedule_id=schedule.id, user_id=customer.id, channel="email", event_type="reorder_reminder", title="Audit refill", body="Audit refill reminder", status="failed", attempts=4, available_at=datetime.utcnow()))
    db.commit()

lock = Lock()
def isolated_db():
    with lock:
        with Session() as db:
            yield db
app.dependency_overrides[get_db] = isolated_db

# Middleware was registered before the test origins were set.
for middleware in app.user_middleware:
    if middleware.cls.__name__ == "CORSMiddleware":
        middleware.kwargs["allow_origins"] = settings.allowed_origins.split(",")

@app.get("/__audit/session/{role}")
def audit_session(role: str):
    phone = "9000000001" if role == "admin" else "9000000002"
    return {"token": jwt.encode({"sub": phone, "role": role, "exp": datetime.utcnow() + timedelta(hours=1)}, settings.jwt_secret, algorithm=settings.jwt_algorithm)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, lifespan="off", log_level="error")
