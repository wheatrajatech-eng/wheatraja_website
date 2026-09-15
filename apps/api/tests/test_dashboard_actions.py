"""Authenticated CRUD, lifecycle and role checks using an isolated database."""
import re
from datetime import datetime, timedelta

import pytest
from fastapi.routing import APIRoute
from jose import jwt

from test_dashboard_contracts import dashboard_client, login
from app.core.config import settings
from app.main import app
from app.models.entities import (AbandonedCartRecovery, Contact, Inventory, Notification, Order, OrderItem,
    ProductVariant, ReminderSchedule, Role, RolePermission, Permission, User, UserRole, WalletTransaction, DeliverySlot)
from app.services.store import ensure_seed_data
from app.services.inventory_lifecycle import reserve_order_inventory, commit_order_inventory


@pytest.fixture
def actions(dashboard_client, monkeypatch):
    client, db = dashboard_client
    monkeypatch.setattr(settings, "enforce_rbac_permissions", True)
    monkeypatch.setattr(settings, "admin_phone_numbers", "9000000001")
    ensure_seed_data(db)
    login(client, "admin")
    return client, db


def request(client, method, path, payload=None, expected=200):
    response = client.request(method, f"/api/v1{path}", json=payload)
    assert response.status_code == expected, (method, path, response.status_code, response.text)
    return response.json()


def test_catalog_category_coupon_banner_crud(actions):
    client, _ = actions
    category = request(client, "POST", "/categories", {"slug": "audit-category", "name": "Audit Category"})
    request(client, "POST", "/categories", {"slug": "audit-category", "name": "Duplicate"}, 409)
    request(client, "PATCH", f"/categories/{category['id']}", {"slug": "audit-category", "name": "Updated Category"})
    product = request(client, "POST", "/products", {"slug": "audit-product", "name": "Audit Product", "description": "Sample product", "variants": [{"weight_kg": 5, "price": 250, "inventory": 10}], "images": ["/sample.png"]})
    request(client, "PATCH", "/products/audit-product", {"name": "Updated Product"})
    request(client, "POST", "/products/audit-product/variants", {"weight_kg": 10, "price": 500, "inventory": 5})
    image = request(client, "POST", "/products/audit-product/images", {"url": "/new.png", "alt": "New"})
    image_id = next(row["id"] for row in image["images"] if row["url"] == "/new.png")
    request(client, "DELETE", f"/products/audit-product/images/{image_id}")
    request(client, "DELETE", "/products/audit-product")
    request(client, "GET", "/products/audit-product", expected=404)
    coupon = request(client, "POST", "/coupons", {"code": "AUDIT10", "percent_off": 10})
    request(client, "PATCH", f"/coupons/{coupon['id']}", {"code": "AUDIT10", "percent_off": 15, "active": False})
    assert not request(client, "POST", "/coupons/apply", {"code": "AUDIT10", "subtotal": 500})["valid"]
    banner = request(client, "POST", "/banners", {"title": "Audit Banner", "link_url": "/products"})
    request(client, "PATCH", f"/banners/{banner['id']}", {"title": "Edited Banner", "active": False})
    request(client, "DELETE", f"/banners/{banner['id']}")
    request(client, "DELETE", f"/banners/{banner['id']}", expected=404)


def test_delivery_slots_create_edit_delete_and_booking_guard(actions):
    client, db = actions
    start = datetime.utcnow() + timedelta(days=10)
    body = {"zone": "Test", "starts_at": start.isoformat(), "ends_at": (start + timedelta(hours=2)).isoformat(), "capacity": 5}
    slot = request(client, "POST", "/growth/admin/delivery-slots", body)
    path = f"/growth/admin/delivery-slots/{slot['id']}"
    request(client, "PATCH", path, {**body, "capacity": 8})
    row = db.get(DeliverySlot, slot["id"])
    row.booked_count = 2
    db.commit()
    request(client, "PATCH", path, {**body, "capacity": 1}, 409)
    request(client, "DELETE", path, expected=409)
    request(client, "PATCH", path, {**body, "active": False})
    row.booked_count = 0
    db.commit()
    request(client, "DELETE", path)
    request(client, "POST", "/growth/admin/delivery-slots", {**body, "ends_at": body["starts_at"]}, 400)


def test_reviews_contacts_support_recoveries(actions):
    client, db = actions
    login(client, "customer")
    review = request(client, "POST", "/reviews", {"slug": "mp-sharbati-atta", "rating": 4, "comment": "Useful review"})
    ticket = request(client, "POST", "/growth/support/tickets", {"subject": "Test request", "message": "Please help with my delivery"})
    login(client, "admin")
    request(client, "PATCH", f"/reviews/{review['id']}", {"approved": True})
    request(client, "PATCH", f"/reviews/{review['id']}", {"approved": False})
    request(client, "DELETE", f"/reviews/{review['id']}")
    request(client, "PATCH", f"/growth/admin/support/{ticket['ticket_number']}", {"status": "resolved", "priority": "high", "resolution_note": "Resolved in test"})
    request(client, "PATCH", f"/growth/admin/support/{ticket['ticket_number']}", {"status": "invalid"}, 422)
    contact = Contact(name="Test Customer", phone="9000000002", message="Please call", status="new")
    recovery = AbandonedCartRecovery(phone="9000000002", session_id="test-recovery", cart_json="[]", subtotal=250, status="open")
    db.add_all([contact, recovery]); db.commit()
    contact_path = f"/admin/contact/contact/{contact.id}"
    request(client, "DELETE", contact_path, expected=409)
    request(client, "PATCH", contact_path + "?status=resolved")
    request(client, "PATCH", contact_path + "?status=spam")
    request(client, "DELETE", contact_path)
    for status in ["reminded", "dismissed", "open"]:
        request(client, "PATCH", f"/growth/admin/recoveries/{recovery.id}", {"status": status, "channel": "phone"})


def test_subscription_all_customer_and_admin_actions(actions):
    client, db = actions
    date = datetime.utcnow() + timedelta(days=20)
    body = {"phone": "9000000002", "slug": "mp-sharbati-atta", "weight_kg": 5, "quantity": 1, "next_delivery_at": date.isoformat()}
    sub = request(client, "POST", "/subscriptions/admin", body)
    path = f"/subscriptions/admin/{sub['id']}"
    request(client, "PATCH", path, {"status": "paused"})
    assert db.query(ReminderSchedule).filter_by(subscription_id=sub["id"]).first().status == "cancelled"
    request(client, "POST", path + "/skip", {}, 400)
    request(client, "PATCH", path, {"status": "active", "quantity": 2, "wallet_auto_deduct": False})
    request(client, "POST", path + "/skip", {})
    request(client, "POST", path + "/vacation", {"start_date": date.isoformat(), "end_date": (date + timedelta(days=60)).isoformat()})
    request(client, "POST", path + "/vacation", {"start_date": date.isoformat(), "end_date": (date - timedelta(days=1)).isoformat()}, 400)
    request(client, "PATCH", path, {"quantity": 0}, 422)
    request(client, "PATCH", path, {"status": "cancelled"})
    request(client, "POST", path + "/generate-cycle", {}, 400)
    login(client, "customer")
    customer_path = f"/subscriptions/{sub['id']}"
    request(client, "PATCH", customer_path, {"status": "active", "quantity": 1})
    request(client, "POST", customer_path + "/skip", {})
    request(client, "POST", customer_path + "/vacation", {"start_date": date.isoformat(), "end_date": (date + timedelta(days=200)).isoformat()})
    request(client, "PATCH", customer_path, {"status": "paused"})
    request(client, "PATCH", customer_path, {"status": "cancelled"})


def test_subscription_generation_stock_and_wallet(actions):
    client, db = actions
    customer = db.query(User).filter_by(phone="9000000002").one()
    db.add(WalletTransaction(user_id=customer.id, amount=1000, reason="test")); db.commit()
    sub = request(client, "POST", "/subscriptions/admin", {"phone": customer.phone, "slug": "mp-sharbati-atta", "weight_kg": 5})
    result = request(client, "POST", f"/subscriptions/admin/{sub['id']}/generate-cycle", {})
    assert result["payment_status"] == "paid"
    order = db.query(Order).filter_by(order_number=result["order_id"]).one()
    assert float(order.wallet_amount) == sub["amount"]
    assert db.query(WalletTransaction).filter_by(order_id=order.id, transaction_type="subscription_deduction").count() == 1


def seed_order(db, status, paid=False):
    user = db.query(User).filter_by(phone="9000000002").one()
    variant = db.query(ProductVariant).first()
    order = Order(user_id=user.id, order_number="WR-LIFECYCLE", status=status, payment_status="paid" if paid else "pending", subtotal=250, total=250, payable_amount=250)
    db.add(order); db.flush()
    item = OrderItem(order_id=order.id, variant_id=variant.id, quantity=1, unit_price=250)
    db.add(item); db.flush()
    reserve_order_inventory(db, order, [(item, variant, 250)]); db.flush()
    if paid: commit_order_inventory(db, order)
    db.commit()
    return order, variant


def test_cancellation_and_return_restock_once(actions):
    client, db = actions
    order, variant = seed_order(db, "delivered", True)
    inventory = db.query(Inventory).filter_by(variant_id=variant.id).one()
    before = inventory.available
    login(client, "customer")
    returned = request(client, "POST", "/returns", {"order_id": order.order_number, "reason": "Damaged product"})
    assert request(client, "POST", "/returns", {"order_id": order.order_number, "reason": "Duplicate request"})["id"] == returned["id"]
    login(client, "admin")
    path = f"/returns/admin/{returned['id']}"
    request(client, "PATCH", path, {"status": "approved", "restock": True}, 409)
    request(client, "PATCH", path, {"status": "approved"})
    request(client, "PATCH", path, {"status": "received", "restock": True})
    db.refresh(inventory); assert inventory.available == before + 1
    request(client, "PATCH", path, {"status": "received", "restock": True})
    db.refresh(inventory); assert inventory.available == before + 1
    request(client, "PATCH", path, {"status": "refunded"}, 409)


def test_unpaid_cancel_releases_stock_and_rejects_other_customer(actions):
    client, db = actions
    order, variant = seed_order(db, "placed")
    inventory = db.query(Inventory).filter_by(variant_id=variant.id).one()
    before = inventory.available
    login(client, "admin")
    request(client, "POST", f"/orders/{order.order_number}/cancel", expected=404)
    login(client, "customer")
    request(client, "POST", f"/orders/{order.order_number}/cancel")
    db.refresh(inventory); assert inventory.available == before + 1
    request(client, "POST", f"/orders/{order.order_number}/cancel", expected=400)


def test_profile_address_notification_and_logout(actions):
    client, db = actions
    login(client, "customer")
    request(client, "PATCH", "/users/me", {"name": "Edited customer", "email": "test@example.com"})
    address = request(client, "POST", "/users/addresses", {"label": "Home", "line1": "Test house in Noida", "pincode": "201301"})
    request(client, "PATCH", f"/users/addresses/{address['id']}", {"label": "Office", "line1": "New office in Noida", "pincode": "201301"})
    request(client, "DELETE", f"/users/addresses/{address['id']}")
    request(client, "DELETE", f"/users/addresses/{address['id']}", expected=404)
    user = db.query(User).filter_by(phone="9000000002").one()
    notice = Notification(user_id=user.id, channel="in_app", title="Test", body="Test notice", read=False)
    db.add(notice); db.commit()
    request(client, "PATCH", f"/notifications/{notice.id}/read")
    request(client, "POST", "/auth/logout")
    assert "wr_access" not in client.cookies
    request(client, "GET", "/auth/me", expected=401)


def test_user_roles_blocking_and_stale_admin_token(actions):
    client, db = actions
    role = db.query(Role).filter_by(name="admin").one()
    request(client, "POST", "/users/admin/accounts", {"phone": "9000000003", "name": "Staff", "role": "admin", "role_ids": [role.id]})
    token = jwt.encode({"sub": "9000000003", "role": "admin"}, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    request(client, "POST", "/users/admin/accounts", {"phone": "9000000003", "role": "customer", "blocked": True})
    client.cookies.set("wr_access", token, domain="testserver.local", path="/")
    request(client, "GET", "/admin/summary", expected=403)
    assert not request(client, "GET", "/auth/session")["authenticated"]
    request(client, "GET", "/orders", expected=403)
    login(client, "admin")
    request(client, "POST", "/users/admin/accounts", {"phone": "9000000001", "blocked": True}, 409)


MUTATIONS = [(method, re.sub(r"\{[^}]+\}", "1", route.path)) for route in app.routes if isinstance(route, APIRoute) and route.path.startswith("/api/v1/")
             and any(dep.call.__name__ in {"require_admin", "dependency"} for dep in route.dependant.dependencies)
             for method in route.methods if method in {"POST", "PATCH", "DELETE"}]


@pytest.mark.parametrize("method,path", MUTATIONS)
def test_customer_cannot_mutate_admin_resources(actions, method, path):
    client, _ = actions
    login(client, "customer")
    response = client.request(method, path, json={})
    assert response.status_code == 403, (method, path, response.text)


def test_restricted_staff_permissions(actions):
    client, db = actions
    admin = db.query(User).filter_by(phone="9000000001").one()
    db.query(UserRole).filter_by(user_id=admin.id).delete()
    limited = Role(name="support-agent", description="Support only")
    db.add(limited); db.flush()
    permission = db.query(Permission).filter_by(key="support.write").one()
    db.add_all([UserRole(user_id=admin.id, role_id=limited.id), RolePermission(role_id=limited.id, permission_id=permission.id)])
    db.commit()
    request(client, "POST", "/users/admin/accounts", {"phone": "9000000004"}, 403)
    request(client, "POST", "/products", {}, 403)
    request(client, "PATCH", "/growth/admin/support/missing", {"status": "closed"}, 404)
    request(client, "POST", "/subscriptions/admin", {}, 403)
