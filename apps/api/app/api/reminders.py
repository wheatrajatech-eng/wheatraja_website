from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_user
from app.core.database import get_db
from app.models.entities import ReminderDeliveryOutbox, ReminderSchedule, User
from app.services.reminders import process_due_reminders, process_reminder_outbox, retry_failed_reminder_outbox, retry_reminder_outbox_item, serialize_reminder, serialize_reminder_outbox_item, serialize_reminder_outbox_timeline
from app.services.store import get_or_create_user

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("")
def my_reminders(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(ReminderSchedule).filter_by(user_id=record.id).order_by(ReminderSchedule.reminder_at.desc()).limit(50).all()
    return [serialize_reminder(row) for row in rows]


@router.post("/admin/process-due")
def run_due_reminders(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    processed = process_due_reminders(db)
    return {"processed": processed}


@router.post("/admin/process-outbox")
def run_reminder_outbox(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    sent = process_reminder_outbox(db)
    return {"sent": sent}


@router.post("/admin/jobs/reminders/process-all")
def run_due_and_outbox_job(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    queued = process_due_reminders(db)
    sent = process_reminder_outbox(db)
    return {"queued": queued, "sent": sent, "job": "reminders.process-all"}


@router.post("/admin/jobs/reminders/process-due")
def run_due_reminders_job(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    processed = process_due_reminders(db)
    return {"processed": processed, "job": "reminders.process-due"}


@router.get("/admin/outbox")
def admin_outbox(status: str | None = None, channel: str | None = None, limit: int = 200, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(ReminderDeliveryOutbox).join(ReminderSchedule, ReminderDeliveryOutbox.reminder_schedule_id == ReminderSchedule.id).join(User, ReminderDeliveryOutbox.user_id == User.id)
    if status:
        query = query.filter(ReminderDeliveryOutbox.status == status)
    if channel:
        query = query.filter(ReminderDeliveryOutbox.channel == channel)
    rows = query.order_by(ReminderDeliveryOutbox.available_at.desc(), ReminderDeliveryOutbox.created_at.desc()).limit(min(limit, 500)).all()
    return [serialize_reminder_outbox_item(row) for row in rows]


@router.get("/admin/outbox/{outbox_id}/timeline")
def outbox_timeline(outbox_id: int, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(ReminderDeliveryOutbox).filter_by(id=outbox_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reminder outbox row not found")
    return serialize_reminder_outbox_timeline(db, row)


@router.post("/admin/outbox/{outbox_id}/retry")
def retry_outbox_item(outbox_id: int, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    row = db.query(ReminderDeliveryOutbox).filter_by(id=outbox_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reminder outbox row not found")
    if row.status != "failed":
        raise HTTPException(status_code=409, detail="Only failed reminders can be retried")
    retry_reminder_outbox_item(db, row)
    db.commit()
    return serialize_reminder_outbox_item(row)


@router.post("/admin/outbox/retry-failed")
def retry_failed_outbox_rows(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    retried = retry_failed_reminder_outbox(db)
    return {"retried": retried}
