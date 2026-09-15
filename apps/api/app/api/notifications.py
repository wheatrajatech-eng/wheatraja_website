from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import Notification, NotificationEvent, User
from app.services.notifications import create_notification
from app.services.store import get_or_create_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationIn(BaseModel):
    phone: str | None = Field(default=None, max_length=20)
    title: str = Field(min_length=2, max_length=160)
    body: str = Field(min_length=2, max_length=500)
    event_type: str = Field(default="admin_message", max_length=120)
    channel: str = Field(default="in_app", max_length=40)


def serialize_notification(row: Notification) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "body": row.body,
        "channel": row.channel,
        "read": row.read,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("")
def list_notifications(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(Notification).filter_by(user_id=record.id).order_by(Notification.created_at.desc()).limit(100).all()
    return [serialize_notification(row) for row in rows]


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Notification).filter_by(id=notification_id, user_id=record.id).first()
    if row:
        row.read = True
        db.commit()
    return {"ok": True}


@router.patch("/{notification_id}/unread")
def mark_unread(notification_id: int, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    row = db.query(Notification).filter_by(id=notification_id, user_id=record.id).first()
    if row:
        row.read = False
        db.commit()
    return {"ok": True}


@router.get("/admin/events")
def admin_events(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(NotificationEvent).order_by(NotificationEvent.created_at.desc()).limit(200).all()
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "event_type": row.event_type,
            "channel": row.channel,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.post("/admin/send")
def admin_send(payload: NotificationIn, admin: dict = Depends(require_admin_permission("notifications.write")), db: Session = Depends(get_db)):
    user_id = None
    if payload.phone:
        user = db.query(User).filter_by(phone=payload.phone).first()
        user_id = user.id if user else None
    create_notification(db, user_id, payload.event_type, payload.title, payload.body, {"source": "admin"}, payload.channel)
    db.commit()
    return {"queued": True, "user_id": user_id}
