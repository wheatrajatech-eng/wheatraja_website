from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Order, Shipment, ShipmentEvent
from app.services.notifications import create_notification
from app.services.store import get_or_create_user

router = APIRouter(prefix="/shipments", tags=["shipments"])


class ShipmentIn(BaseModel):
    order_id: str
    provider: str | None = Field(default=None, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=160)
    status: str = Field(default="pending", max_length=60)
    estimated_delivery_at: datetime | None = None


class ShipmentEventIn(BaseModel):
    status: str = Field(max_length=80)
    location: str | None = Field(default=None, max_length=160)
    note: str | None = Field(default=None, max_length=300)
    occurred_at: datetime | None = None


def serialize_event(row: ShipmentEvent) -> dict:
    return {
        "id": row.id,
        "status": row.status,
        "location": row.location,
        "note": row.note,
        "occurred_at": row.occurred_at.isoformat() if row.occurred_at else None,
    }


def serialize_shipment(row: Shipment, db: Session) -> dict:
    events = db.query(ShipmentEvent).filter_by(shipment_id=row.id).order_by(ShipmentEvent.occurred_at.asc()).all()
    order = db.query(Order).filter_by(id=row.order_id).first()
    return {
        "id": row.id,
        "order_id": order.order_number if order else row.order_id,
        "provider": row.provider,
        "tracking_number": row.tracking_number,
        "status": row.status,
        "estimated_delivery_at": row.estimated_delivery_at.isoformat() if row.estimated_delivery_at else None,
        "delivered_at": row.delivered_at.isoformat() if row.delivered_at else None,
        "events": [serialize_event(event) for event in events],
    }


def sync_order_from_shipment(order: Order, status: str) -> None:
    if status in {"packed", "shipped", "out_for_delivery", "delivered"}:
        order.status = status


@router.get("/my/{order_id}")
def my_shipment(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    shipment = db.query(Shipment).filter_by(order_id=order.id).first()
    return serialize_shipment(shipment, db) if shipment else {"order_id": order.order_number, "status": "not_shipped", "events": []}


@router.get("/admin")
def admin_shipments(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(Shipment).order_by(Shipment.created_at.desc()).limit(200).all()
    return [serialize_shipment(row, db) for row in rows]


@router.post("/admin")
def upsert_shipment(payload: ShipmentIn, admin: dict = Depends(require_admin_permission("shipments.write")), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=payload.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    shipment = db.query(Shipment).filter_by(order_id=order.id).first()
    if not shipment:
        shipment = Shipment(order_id=order.id)
        db.add(shipment)
    shipment.provider = payload.provider
    shipment.tracking_number = payload.tracking_number
    shipment.status = payload.status
    shipment.estimated_delivery_at = payload.estimated_delivery_at
    if payload.status == "delivered":
        shipment.delivered_at = datetime.utcnow()
    sync_order_from_shipment(order, payload.status)
    db.flush()
    db.add(ShipmentEvent(shipment_id=shipment.id, status=payload.status, note="Shipment updated by admin", occurred_at=datetime.utcnow()))
    admin_user = get_or_create_user(db, admin["sub"], "admin")
    db.add(AdminAuditLog(admin_id=admin_user.id, action="shipment_upsert", entity=f"order:{order.order_number}", metadata_json=f'{{"status":"{payload.status}"}}'))
    create_notification(db, order.user_id, "shipment_update", "Shipment updated", f"Shipment for {order.order_number} is {payload.status}.", {"order_id": order.order_number})
    db.commit()
    db.refresh(shipment)
    return serialize_shipment(shipment, db)


@router.post("/admin/{shipment_id}/events")
def add_event(shipment_id: int, payload: ShipmentEventIn, admin: dict = Depends(require_admin_permission("shipments.write")), db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter_by(id=shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment.status = payload.status
    if payload.status == "delivered":
        shipment.delivered_at = payload.occurred_at or datetime.utcnow()
    db.add(ShipmentEvent(shipment_id=shipment.id, status=payload.status, location=payload.location, note=payload.note, occurred_at=payload.occurred_at or datetime.utcnow()))
    order = db.query(Order).filter_by(id=shipment.order_id).first()
    if order:
        sync_order_from_shipment(order, payload.status)
        create_notification(db, order.user_id, "shipment_event", "Tracking updated", f"Order {order.order_number}: {payload.status}.", {"order_id": order.order_number})
    db.commit()
    return serialize_shipment(shipment, db)
