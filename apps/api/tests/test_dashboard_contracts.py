"""Exercise the dashboard API contracts against an isolated database."""

import json
import re
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models.entities import NotificationEvent, ReminderDeliveryOutbox, ReminderSchedule, User
from app.services.reminders import serialize_reminder_outbox_timeline


@pytest.fixture
def dashboard_client(monkeypatch):
    monkeypatch.setattr(settings, "enforce_rbac_permissions", False)
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, autoflush=False)()
    db.add_all([
        User(phone="9000000001", role="admin", profile_complete=True, referral_code="QRTM"),
        User(phone="9000000002", role="customer", profile_complete=True, referral_code="WXYZ"),
    ])
    db.commit()
    app.dependency_overrides[get_db] = lambda: db
    # No lifespan: avoid application bootstrap and the background delivery worker.
    client = TestClient(app)
    client.cookies.set("wr_csrf", "test-csrf")
    client.headers["X-CSRF-Token"] = "test-csrf"
    try:
        yield client, db
    finally:
        client.close()
        app.dependency_overrides.pop(get_db, None)
        db.close()
        engine.dispose()


def login(client, role):
    role = "admin" if role == "superadmin" else role
    phone = "9000000001" if role == "admin" else "9000000002"
    client.cookies.set("wr_access", jwt.encode({"sub": phone, "role": role}, settings.jwt_secret, algorithm=settings.jwt_algorithm), domain="testserver.local", path="/")


ADMIN_CONFIG = Path(__file__).resolve().parents[2] / "admin/lib/admin-config.ts"
ADMIN_ENDPOINTS = sorted(set(re.findall(r'endpoint: "([^"]+)"', ADMIN_CONFIG.read_text())))


@pytest.mark.parametrize("endpoint", ADMIN_ENDPOINTS)
def test_admin_navigation_api(dashboard_client, endpoint):
    client, _ = dashboard_client
    login(client, "superadmin")
    response = client.get(f"/api/v1{endpoint}")
    assert response.status_code == 200, (endpoint, response.text)


@pytest.mark.parametrize("endpoint", ["/auth/me", "/auth/session", "/orders", "/users/addresses", "/subscriptions", "/wallet", "/referrals", "/reminders", "/notifications", "/wishlist"])
def test_customer_navigation_api(dashboard_client, endpoint):
    client, _ = dashboard_client
    login(client, "customer")
    response = client.get(f"/api/v1{endpoint}")
    assert response.status_code == 200, (endpoint, response.text)


def test_referral_application_and_admin_access(dashboard_client):
    client, _ = dashboard_client
    login(client, "customer")
    assert client.get("/api/v1/reminders/admin/outbox").status_code == 403
    assert client.post("/api/v1/referrals/apply", json={"code": "BOOK"}).status_code == 400
    assert client.post("/api/v1/referrals/apply", json={"code": "QRTM"}).status_code == 200
    assert client.post("/api/v1/referrals/apply", json={"code": "QRTM"}).status_code == 200


def test_reminder_inspector_retry_and_customer_isolation(dashboard_client):
    client, db = dashboard_client
    customer = db.query(User).filter_by(phone="9000000002").one()
    schedule = ReminderSchedule(user_id=customer.id, schedule_key="test:one", kind="reorder", status="failed", channel="in_app", reminder_at=datetime.utcnow())
    db.add(schedule)
    db.flush()
    row = ReminderDeliveryOutbox(reminder_schedule_id=schedule.id, user_id=customer.id, channel="email", event_type="reorder_reminder", title="Refill", body="Refill reminder", status="failed", attempts=4, available_at=datetime.utcnow())
    db.add(row)
    db.flush()
    db.add(NotificationEvent(user_id=customer.id, channel="email", event_type="reorder_reminder", status="failed", payload_json=json.dumps({"outbox_id": row.id + 100, "error": "unrelated"})))
    db.commit()
    login(client, "superadmin")
    response = client.get("/api/v1/reminders/admin/outbox?status=failed")
    assert response.json()[0]["attempts"] == 4
    assert client.get(f"/api/v1/users/admin/customers/{customer.phone}").status_code == 200
    assert client.post(f"/api/v1/reminders/admin/outbox/{row.id}/retry").status_code == 200
    assert client.post(f"/api/v1/reminders/admin/outbox/{row.id}/retry").status_code == 409
    assert schedule.status == "processing"
    timeline = serialize_reminder_outbox_timeline(db, row)["timeline"]
    assert any(item["label"] == "Retry requested" for item in timeline)
    assert "unrelated" not in json.dumps(timeline)
    login(client, "customer")
    assert len(client.get("/api/v1/reminders").json()) == 1
    login(client, "superadmin")
    assert client.get("/api/v1/reminders").json() == []
