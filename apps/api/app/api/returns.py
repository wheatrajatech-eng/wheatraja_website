from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Order, ReturnItem, ReturnRequest
from app.services.inventory_lifecycle import restock_returned_order
from app.services.notifications import create_notification
from app.services.store import get_or_create_user

router = APIRouter(prefix="/returns", tags=["returns"])


class ReturnRequestIn(BaseModel):
    order_id: str
    reason: str = Field(min_length=3, max_length=240)


class ReturnDecisionIn(BaseModel):
    status: str = Field(pattern="^(approved|rejected|received|refunded)$")
    resolution_note: str | None = Field(default=None, max_length=500)
    restock: bool = False


def serialize_return(row: ReturnRequest, db: Session) -> dict:
    order = db.query(Order).filter_by(id=row.order_id).first()
    return {
        "id": row.id,
        "order_id": order.order_number if order else row.order_id,
        "user_id": row.user_id,
        "reason": row.reason,
        "status": row.status,
        "resolution_note": row.resolution_note,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.get("")
def my_returns(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(ReturnRequest).filter_by(user_id=record.id).order_by(ReturnRequest.created_at.desc()).all()
    return [serialize_return(row, db) for row in rows]


@router.post("")
def request_return(payload: ReturnRequestIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    order = db.query(Order).filter_by(order_number=payload.order_id, user_id=record.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    existing = db.query(ReturnRequest).filter_by(order_id=order.id).first()
    if existing:
        return serialize_return(existing, db)
    if order.status not in {"delivered", "out_for_delivery"}:
        raise HTTPException(status_code=400, detail="Only delivered/out-for-delivery orders can enter return flow")
    row = ReturnRequest(order_id=order.id, user_id=record.id, reason=payload.reason, status="requested")
    db.add(row)
    order.status = "return_requested"
    db.flush()
    for item in order.items:
        db.add(ReturnItem(return_id=row.id, order_item_id=item.id, quantity=item.quantity, condition="pending_review"))
    create_notification(db, record.id, "return_requested", "Return requested", f"Return requested for order {order.order_number}.", {"order_id": order.order_number})
    db.commit()
    return serialize_return(row, db)


@router.get("/admin")
def admin_returns(admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(ReturnRequest).order_by(ReturnRequest.created_at.desc()).limit(200).all()
    return [serialize_return(row, db) for row in rows]


@router.patch("/admin/{return_id}")
def decide_return(return_id: int, payload: ReturnDecisionIn, admin: dict = Depends(require_admin_permission("returns.decide")), db: Session = Depends(get_db)):
    row = db.query(ReturnRequest).filter_by(id=return_id).with_for_update().first()
    if not row:
        raise HTTPException(status_code=404, detail="Return request not found")
    order = db.query(Order).filter_by(id=row.order_id).first()
    allowed = {"requested": {"approved", "rejected"}, "approved": {"received"}, "received": {"refunded"}, "rejected": set(), "refunded": set()}
    if payload.status != row.status and payload.status not in allowed.get(row.status, set()):
        raise HTTPException(status_code=409, detail="Invalid return status transition")
    if payload.restock and payload.status != "received":
        raise HTTPException(status_code=409, detail="Restock only when goods are received")
    if payload.status == "refunded" and (not order or order.payment_status not in {"refunded", "partially_refunded"}):
        raise HTTPException(status_code=409, detail="Process the payment refund before marking the return refunded")
    row.status = payload.status
    row.resolution_note = payload.resolution_note
    if order:
        if payload.status == "rejected":
            order.status = "delivered"
        elif payload.status in {"received", "refunded"}:
            order.status = "returned"
            if payload.restock:
                restock_returned_order(db, order)
        create_notification(db, row.user_id, "return_update", "Return updated", f"Return for order {order.order_number} is {payload.status}.", {"order_id": order.order_number})
    db.add(AdminAuditLog(admin_id=get_or_create_user(db, admin["sub"], "admin").id, action="return_decision", entity=f"return:{row.id}", metadata_json="{}"))
    db.commit()
    return serialize_return(row, db)
