from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_user
from app.core.database import get_db
from app.models.entities import Order
from app.services.invoices import invoice_payload, render_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])


def invoice_response(payload: dict) -> Response:
    pdf = render_invoice_pdf(payload)
    filename = f"{payload['invoice_number']}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{order_id}")
def get_invoice(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).join(Order.user).filter(Order.order_number == order_id, Order.user.has(phone=user["sub"])).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payload = invoice_payload(db, order)
    db.commit()
    return payload


@router.get("/{order_id}/pdf")
def get_invoice_pdf(order_id: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).join(Order.user).filter(Order.order_number == order_id, Order.user.has(phone=user["sub"])).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payload = invoice_payload(db, order)
    db.commit()
    return invoice_response(payload)


@router.get("/admin/{order_id}")
def get_admin_invoice(order_id: str, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payload = invoice_payload(db, order)
    db.commit()
    return payload


@router.get("/admin/{order_id}/pdf")
def get_admin_invoice_pdf(order_id: str, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    order = db.query(Order).filter_by(order_number=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    payload = invoice_payload(db, order)
    db.commit()
    return invoice_response(payload)
