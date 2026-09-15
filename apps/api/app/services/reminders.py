from __future__ import annotations

import json
import re
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    NotificationEvent,
    Order,
    ReminderDeliveryOutbox,
    ReminderSchedule,
    Setting,
    Subscription,
    User,
)
from app.services.notifications import create_notification, provider_for

def _setting_value(db: Session, key: str, default: str) -> str:
    row = db.query(Setting).filter_by(key=key).first()
    if row and row.value is not None and str(row.value).strip():
        return str(row.value).strip()
    return default


def _configured_delivery_channels(db: Session) -> tuple[str, ...]:
    raw = _setting_value(db, "reminder_delivery_channels", settings.reminder_delivery_channels or "in_app")
    channels: list[str] = []
    for value in raw.split(","):
        channel = value.strip().lower()
        if channel in {"in_app", "email", "whatsapp"} and channel not in channels:
            channels.append(channel)
    if "in_app" not in channels:
        channels.insert(0, "in_app")
    return tuple(channels)


def _normalize_whatsapp_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D+", "", phone)
    if not digits:
        return None
    if phone.strip().startswith("+"):
        return f"+{digits}"
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) >= 12 and digits.startswith("91"):
        return f"+{digits}"
    return f"+{digits}"


def _order_line_items(order: Order) -> list[dict]:
    lines: list[dict] = []
    for item in order.items:
        if not item.variant or not item.variant.product:
            continue
        lines.append(
            {
                "name": item.variant.product.name,
                "slug": item.variant.product.slug,
                "weight_kg": item.variant.weight_kg,
                "quantity": item.quantity,
                "subscription": item.subscription,
            }
        )
    return lines


def _order_summary(lines: list[dict]) -> str:
    if not lines:
        return "Fresh atta"
    return ", ".join(f"{line['name']} {line['weight_kg']}kg x{line['quantity']}" for line in lines[:4])


def _lead_days_for_subscription(subscription: Subscription) -> int:
    if subscription.cadence == "15_days":
        return 3
    return 5


def _reorder_payload(order: Order) -> dict:
    lines = _order_line_items(order)
    total_kg = round(sum(float(line["weight_kg"] or 0) * float(line["quantity"] or 0) for line in lines), 2)
    estimated_days = max(1, round(total_kg * 4))
    reminder_days = max(1, round(estimated_days * 0.75))
    return {
        "order_id": order.order_number,
        "order_number": order.order_number,
        "summary": _order_summary(lines),
        "line_items": lines,
        "total_kg": total_kg,
        "estimated_days": estimated_days,
        "reminder_days": reminder_days,
        "message": "Your atta order may be nearing the end of its usual usage cycle.",
    }


def _subscription_payload(subscription: Subscription) -> dict:
    return {
        "subscription_id": subscription.id,
        "product_name": subscription.variant.product.name if subscription.variant and subscription.variant.product else "your subscription",
        "weight_kg": subscription.variant.weight_kg if subscription.variant else None,
        "quantity": subscription.quantity,
        "cadence": subscription.cadence,
        "next_delivery_at": subscription.next_delivery_at.isoformat() if subscription.next_delivery_at else None,
        "lead_days": _lead_days_for_subscription(subscription),
        "summary": (
            f"{subscription.variant.product.name if subscription.variant and subscription.variant.product else 'Subscription'} "
            f"{subscription.variant.weight_kg if subscription.variant else ''}kg x{subscription.quantity}"
        ).strip(),
        "message": "Your next subscription delivery is coming up.",
    }


def _target_channels(db: Session, user: User | None) -> tuple[str, ...]:
    channels = _configured_delivery_channels(db)
    selected: list[str] = ["in_app"]
    if "email" in channels and user and user.email:
        selected.append("email")
    if "whatsapp" in channels and user and user.phone and settings.whatsapp_provider != "disabled":
        selected.append("whatsapp")
    return tuple(selected)


def _notification_title_and_body(row: ReminderSchedule, channel: str, payload: dict, user: User | None) -> tuple[str, str]:
    name = (user.name or "there").strip() if user and user.name else "there"
    if row.kind == "subscription_renewal":
        title = "Subscription delivery reminder"
        if channel == "whatsapp":
            body = (
                f"Hi {name}, your Wheat Raja subscription for {payload.get('summary', 'fresh atta')} "
                f"is due around {payload.get('next_delivery_at', 'soon')}.\n"
                f"Lead time: {payload.get('lead_days', 5)} days.\n"
                "Please review quantity or wallet balance in your account."
            )
        else:
            body = (
                f"Hi {name},\n\n"
                f"Your Wheat Raja subscription for {payload.get('summary', 'fresh atta')} is coming up on "
                f"{payload.get('next_delivery_at', 'the next delivery date')}.\n"
                f"Lead time: {payload.get('lead_days', 5)} days.\n"
                "Please review quantity, wallet balance and any delivery notes.\n\n"
                "You can update the plan from your account dashboard."
            )
        return title, body

    title = "Time to reorder fresh atta"
    if channel == "whatsapp":
        body = (
            f"Hi {name}, your Wheat Raja order {payload.get('order_number', payload.get('order_id', ''))} "
            f"may be due for a refill.\n"
            f"Items: {payload.get('summary', 'fresh atta')}\n"
            f"Estimated usage: {payload.get('estimated_days', 1)} days.\n"
            "Tap your account to reorder."
        )
    else:
        body = (
            f"Hi {name},\n\n"
            f"Your Wheat Raja order {payload.get('order_number', payload.get('order_id', ''))} looks like it may be nearing the end of its usual usage cycle.\n"
            f"Items: {payload.get('summary', 'fresh atta')}\n"
            f"Estimated usage: {payload.get('estimated_days', 1)} days.\n"
            f"Recommended reorder window: about {payload.get('reminder_days', 1)} days after purchase.\n\n"
            "You can reorder directly from your account for the same mix or adjust the quantity as needed."
        )
    return title, body


def _queue_delivery_outbox(db: Session, row: ReminderSchedule, user: User | None, payload: dict, now: datetime) -> int:
    queued = 0
    for channel in _target_channels(db, user):
        if channel == "in_app":
            continue
        title, body = _notification_title_and_body(row, channel, payload, user)
        outbox = db.query(ReminderDeliveryOutbox).filter_by(reminder_schedule_id=row.id, channel=channel).first()
        outbox_payload = {
            **payload,
            "channel": channel,
            "reminder_id": row.id,
            "schedule_key": row.schedule_key,
            "user_id": row.user_id,
            "email": user.email if user else None,
            "phone": _normalize_whatsapp_phone(user.phone) if user else None,
        }
        if not outbox:
            outbox = ReminderDeliveryOutbox(
                reminder_schedule_id=row.id,
                user_id=row.user_id,
                channel=channel,
                event_type=f"{row.kind}_reminder",
                title=title,
                body=body,
                payload_json=json.dumps(outbox_payload),
                status="queued",
                attempts=0,
                available_at=now,
            )
            db.add(outbox)
        else:
            outbox.event_type = f"{row.kind}_reminder"
            outbox.title = title
            outbox.body = body
            outbox.payload_json = json.dumps(outbox_payload)
            outbox.status = "queued"
            outbox.attempts = 0
            outbox.available_at = now
            outbox.last_attempt_at = None
            outbox.sent_at = None
            outbox.provider_message_id = None
            outbox.last_error = None
        queued += 1
    return queued


def _refresh_schedule_delivery_state(db: Session, schedule_id: int, now: datetime) -> None:
    rows = db.query(ReminderDeliveryOutbox).filter_by(reminder_schedule_id=schedule_id).all()
    if not rows:
        schedule = db.query(ReminderSchedule).filter_by(id=schedule_id).first()
        if schedule:
            schedule.status = "sent"
            schedule.sent_at = now
            schedule.last_sent_at = now
        return

    pending = [row for row in rows if row.status in {"queued", "processing"}]
    if pending:
        schedule = db.query(ReminderSchedule).filter_by(id=schedule_id).first()
        if schedule:
            schedule.status = "processing"
            schedule.last_sent_at = now
        return

    schedule = db.query(ReminderSchedule).filter_by(id=schedule_id).first()
    if not schedule:
        return
    if any(row.status == "failed" for row in rows):
        schedule.status = "failed"
    else:
        schedule.status = "sent"
        schedule.sent_at = now
    schedule.last_sent_at = now


def serialize_reminder_outbox_item(row: ReminderDeliveryOutbox) -> dict:
    payload = json.loads(row.payload_json) if row.payload_json else {}
    schedule = row.reminder_schedule if hasattr(row, "reminder_schedule") and row.reminder_schedule else None
    return {
        "id": row.id,
        "reminder_schedule_id": row.reminder_schedule_id,
        "schedule_key": schedule.schedule_key if schedule else None,
        "user_id": row.user_id,
        "customer_phone": schedule and schedule.user.phone if schedule and schedule.user else None,
        "customer_email": schedule and schedule.user.email if schedule and schedule.user else None,
        "order_id": schedule.order_id if schedule else None,
        "subscription_id": schedule.subscription_id if schedule else None,
        "kind": schedule.kind if schedule else None,
        "channel": row.channel,
        "event_type": row.event_type,
        "title": row.title,
        "body": row.body,
        "payload": payload,
        "status": row.status,
        "attempts": row.attempts,
        "available_at": row.available_at.isoformat() if row.available_at else None,
        "last_attempt_at": row.last_attempt_at.isoformat() if row.last_attempt_at else None,
        "sent_at": row.sent_at.isoformat() if row.sent_at else None,
        "provider_message_id": row.provider_message_id,
        "last_error": row.last_error,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def serialize_reminder_outbox_timeline(db: Session, row: ReminderDeliveryOutbox) -> dict:
    schedule = row.reminder_schedule if hasattr(row, "reminder_schedule") and row.reminder_schedule else db.query(ReminderSchedule).filter_by(id=row.reminder_schedule_id).first()
    user = db.query(User).filter_by(id=row.user_id).first()
    payload = json.loads(row.payload_json) if row.payload_json else {}
    timeline: list[dict] = []

    if schedule:
        schedule_payload = json.loads(schedule.payload_json) if schedule.payload_json else {}
        timeline.append(
            {
                "at": schedule.created_at.isoformat() if schedule.created_at else None,
                "source": "schedule",
                "label": "Reminder scheduled",
                "status": schedule.status,
                "channel": schedule.channel,
                "details": {
                    "schedule_key": schedule.schedule_key,
                    "kind": schedule.kind,
                    "reminder_at": schedule.reminder_at.isoformat() if schedule.reminder_at else None,
                    "payload": schedule_payload,
                },
            }
        )

    timeline.append(
        {
            "at": row.created_at.isoformat() if row.created_at else None,
            "source": "outbox",
            "label": f"Queued for {row.channel}",
            "status": row.status,
            "channel": row.channel,
            "details": {
                "event_type": row.event_type,
                "attempts": row.attempts,
                "available_at": row.available_at.isoformat() if row.available_at else None,
            },
        }
    )

    events = (
        db.query(NotificationEvent)
        .filter(
            NotificationEvent.user_id == row.user_id,
            NotificationEvent.event_type == row.event_type,
            NotificationEvent.channel == row.channel,
        )
        .order_by(NotificationEvent.created_at.asc())
        .all()
    )
    for event in events:
        event_payload = json.loads(event.payload_json) if event.payload_json else {}
        if event_payload.get("outbox_id") != row.id and not (
            "outbox_id" not in event_payload and event_payload.get("reminder_id") == row.reminder_schedule_id
        ):
            continue
        timeline.append(
            {
                "at": event.created_at.isoformat() if event.created_at else None,
                "source": "notification_event",
                "label": "Retry requested" if event_payload.get("action") == "manual_retry" else "Delivery attempt",
                "status": event.status,
                "channel": event.channel,
                "details": {
                    "event_id": event.id,
                    "provider_message_id": event_payload.get("provider_message_id"),
                    "error": event_payload.get("error"),
                    "payload": event_payload,
                },
            }
        )

    if row.last_attempt_at or row.sent_at or row.last_error:
        timeline.append(
            {
                "at": (row.sent_at or row.last_attempt_at or row.created_at).isoformat() if (row.sent_at or row.last_attempt_at or row.created_at) else None,
                "source": "outbox_state",
                "label": "Current delivery state",
                "status": row.status,
                "channel": row.channel,
                "details": {
                    "attempts": row.attempts,
                    "provider_message_id": row.provider_message_id,
                    "last_error": row.last_error,
                    "last_attempt_at": row.last_attempt_at.isoformat() if row.last_attempt_at else None,
                    "sent_at": row.sent_at.isoformat() if row.sent_at else None,
                },
            }
        )

    timeline.sort(key=lambda item: item.get("at") or "")
    return {
        "row": serialize_reminder_outbox_item(row),
        "customer": {
            "name": user.name if user else None,
            "phone": user.phone if user else None,
            "email": user.email if user else None,
        },
        "timeline": timeline,
    }


def serialize_reminder(row: ReminderSchedule) -> dict:
    payload = json.loads(row.payload_json) if row.payload_json else {}
    return {
        "id": row.id,
        "schedule_key": row.schedule_key,
        "user_id": row.user_id,
        "order_id": row.order_id,
        "subscription_id": row.subscription_id,
        "kind": row.kind,
        "status": row.status,
        "channel": row.channel,
        "reminder_at": row.reminder_at.isoformat() if row.reminder_at else None,
        "sent_at": row.sent_at.isoformat() if row.sent_at else None,
        "payload": payload,
        "delivery_channels": payload.get("delivery_channels", []),
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


def schedule_order_reorder_reminder(db: Session, order: Order) -> ReminderSchedule | None:
    if order.payment_status not in {"paid", "demo_paid"}:
        return None
    if not order.items:
        return None
    payload = _reorder_payload(order)
    created_at = order.created_at or datetime.utcnow()
    reminder_at = created_at + timedelta(days=int(payload["reminder_days"]))
    key = f"order:{order.order_number}:reorder"
    payload["delivery_channels"] = list(_configured_delivery_channels(db))
    row = db.query(ReminderSchedule).filter_by(schedule_key=key).first()
    if not row:
        row = ReminderSchedule(
            schedule_key=key,
            user_id=order.user_id,
            order_id=order.id,
            kind="reorder",
            channel="in_app",
            status="queued",
            reminder_at=reminder_at,
            payload_json=json.dumps(payload),
        )
        db.add(row)
    else:
        row.user_id = order.user_id
        row.order_id = order.id
        row.kind = "reorder"
        row.channel = "in_app"
        row.status = "queued"
        row.reminder_at = reminder_at
        row.payload_json = json.dumps(payload)
    return row


def schedule_subscription_reminder(db: Session, subscription: Subscription) -> ReminderSchedule | None:
    if not subscription.active or not subscription.next_delivery_at:
        return None
    lead_days = _lead_days_for_subscription(subscription)
    reminder_at = subscription.next_delivery_at - timedelta(days=lead_days)
    now = datetime.utcnow()
    if reminder_at < now:
        reminder_at = now + timedelta(minutes=1)
    key = f"subscription:{subscription.id}:renewal"
    payload = _subscription_payload(subscription)
    payload["delivery_channels"] = list(_configured_delivery_channels(db))
    row = db.query(ReminderSchedule).filter_by(schedule_key=key).first()
    if not row:
        row = ReminderSchedule(
            schedule_key=key,
            user_id=subscription.user_id,
            subscription_id=subscription.id,
            kind="subscription_renewal",
            channel="in_app",
            status="queued",
            reminder_at=reminder_at,
            payload_json=json.dumps(payload),
        )
        db.add(row)
    else:
        row.user_id = subscription.user_id
        row.subscription_id = subscription.id
        row.kind = "subscription_renewal"
        row.channel = "in_app"
        row.status = "queued"
        row.reminder_at = reminder_at
        row.payload_json = json.dumps(payload)
    return row


def process_due_reminders(db: Session, now: datetime | None = None) -> int:
    current = now or datetime.utcnow()
    rows = (
        db.query(ReminderSchedule)
        .filter(ReminderSchedule.status == "queued", ReminderSchedule.reminder_at <= current)
        .order_by(ReminderSchedule.reminder_at.asc())
        .all()
    )
    processed = 0
    for row in rows:
        payload = json.loads(row.payload_json) if row.payload_json else {}
        user = db.query(User).filter_by(id=row.user_id).first()
        in_app_title, in_app_body = _notification_title_and_body(row, "in_app", payload, user)
        create_notification(
            db,
            row.user_id,
            f"{row.kind}_reminder",
            in_app_title,
            in_app_body,
            {**payload, "reminder_id": row.id, "kind": row.kind, "delivery_channel": "in_app"},
            "in_app",
        )
        queued = _queue_delivery_outbox(db, row, user, payload, current)
        row.last_sent_at = current
        if queued:
            row.status = "processing"
        else:
            row.status = "sent"
            row.sent_at = current
        processed += 1
    if processed:
        db.commit()
    return processed


def process_reminder_outbox(db: Session, now: datetime | None = None) -> int:
    current = now or datetime.utcnow()
    rows = (
        db.query(ReminderDeliveryOutbox)
        .filter(ReminderDeliveryOutbox.status == "queued", ReminderDeliveryOutbox.available_at <= current)
        .order_by(ReminderDeliveryOutbox.available_at.asc(), ReminderDeliveryOutbox.id.asc())
        .all()
    )
    sent = 0
    for row in rows:
        payload = json.loads(row.payload_json) if row.payload_json else {}
        user = db.query(User).filter_by(id=row.user_id).first()
        payload = {**payload, "outbox_id": row.id}
        if not payload.get("email") and user:
            payload["email"] = user.email
        if not payload.get("phone") and user:
            payload["phone"] = _normalize_whatsapp_phone(user.phone)
        event = NotificationEvent(
            user_id=row.user_id,
            event_type=row.event_type,
            channel=row.channel,
            status="queued",
            payload_json=json.dumps(payload),
        )
        db.add(event)
        db.flush()
        try:
            row.attempts += 1
            if not payload.get("email" if row.channel == "email" else "phone"):
                raise ValueError("Reminder recipient is missing")
            delivery = provider_for(row.channel).send(row.user_id, row.event_type, row.title, row.body, payload)
            if delivery.status != "sent":
                raise RuntimeError(delivery.error or f"Provider returned {delivery.status}")
            event.status = delivery.status
            event.payload_json = json.dumps({**payload, "provider_message_id": delivery.provider_message_id})
            row.status = "sent"
            row.sent_at = current
            row.last_attempt_at = current
            row.provider_message_id = delivery.provider_message_id
            row.last_error = None
            sent += 1
        except Exception as exc:
            event.status = "failed"
            event.payload_json = json.dumps({**payload, "error": str(exc)})
            row.last_attempt_at = current
            row.last_error = str(exc)
            if row.attempts >= settings.reminder_outbox_max_attempts:
                row.status = "failed"
            else:
                row.status = "queued"
                row.available_at = current + timedelta(minutes=settings.reminder_outbox_retry_minutes * row.attempts)
        db.flush()
        _refresh_schedule_delivery_state(db, row.reminder_schedule_id, current)
    if rows:
        db.commit()
    return sent


def retry_reminder_outbox_item(db: Session, row: ReminderDeliveryOutbox, now: datetime | None = None) -> ReminderDeliveryOutbox:
    current = now or datetime.utcnow()
    if row.status != "failed":
        raise ValueError("Only failed reminders can be retried")
    db.add(NotificationEvent(
        user_id=row.user_id, event_type=row.event_type, channel=row.channel, status="queued",
        payload_json=json.dumps({"outbox_id": row.id, "reminder_id": row.reminder_schedule_id,
                                 "action": "manual_retry", "previous_attempts": row.attempts, "error": row.last_error}),
    ))
    row.status = "queued"
    row.available_at = current
    row.last_error = None
    row.last_attempt_at = None
    row.sent_at = None
    row.provider_message_id = None
    db.flush()
    _refresh_schedule_delivery_state(db, row.reminder_schedule_id, current)
    return row


def retry_failed_reminder_outbox(db: Session, now: datetime | None = None) -> int:
    current = now or datetime.utcnow()
    rows = db.query(ReminderDeliveryOutbox).filter(ReminderDeliveryOutbox.status == "failed").all()
    for row in rows:
        retry_reminder_outbox_item(db, row, current)
    if rows:
        db.commit()
    return len(rows)
