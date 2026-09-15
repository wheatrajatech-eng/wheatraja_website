import io
import json
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import Invoice, InvoiceSequence, Order
from app.services.store import money


def seller_snapshot() -> dict:
    return {
        "legal_name": settings.seller_legal_name,
        "gstin": settings.seller_gstin,
        "address": settings.seller_address,
        "state_code": settings.seller_state_code,
    }


def tax_snapshot() -> dict:
    return {
        "cgst_rate": settings.invoice_cgst_rate,
        "sgst_rate": settings.invoice_sgst_rate,
        "igst_rate": settings.invoice_igst_rate,
    }


def next_invoice_number(db: Session) -> str:
    fiscal_year = settings.invoice_fiscal_year.strip() or "FY26-27"
    sequence = db.query(InvoiceSequence).filter_by(fiscal_year=fiscal_year).with_for_update().first()
    if not sequence:
        sequence = InvoiceSequence(fiscal_year=fiscal_year, last_number=0)
        db.add(sequence)
        db.flush()
    sequence.last_number += 1
    normalized_year = fiscal_year.replace("/", "-")
    return f"WR/{normalized_year}/{sequence.last_number:06d}"


def get_or_create_invoice(db: Session, order: Order) -> Invoice:
    invoice = db.query(Invoice).filter_by(order_id=order.id).first()
    if invoice:
        return invoice
    invoice = Invoice(
        order_id=order.id,
        invoice_number=next_invoice_number(db),
        invoice_date=datetime.utcnow(),
        status="issued",
        seller_json=json.dumps(seller_snapshot()),
        tax_json=json.dumps(tax_snapshot()),
    )
    db.add(invoice)
    db.flush()
    return invoice


def invoice_payload(db: Session, order: Order) -> dict:
    invoice = get_or_create_invoice(db, order)
    seller = json.loads(invoice.seller_json or "{}")
    tax = json.loads(invoice.tax_json or "{}")
    line_items = []
    taxable_total = 0.0
    cgst_total = 0.0
    sgst_total = 0.0
    igst_total = 0.0
    for item in order.items:
        amount = money(item.unit_price) * item.quantity
        taxable_total += amount
        variant = item.variant
        product = variant.product
        gst_rate = money(product.gst_rate) if product.gst_rate is not None else money((tax.get("cgst_rate") or 0) + (tax.get("sgst_rate") or 0) + (tax.get("igst_rate") or 0))
        igst_rate = money(tax.get("igst_rate") or 0)
        if igst_rate:
            line_igst = round(amount * gst_rate / 100, 2)
            line_cgst = 0.0
            line_sgst = 0.0
        else:
            line_cgst = round(amount * (gst_rate / 2) / 100, 2)
            line_sgst = round(amount * (gst_rate / 2) / 100, 2)
            line_igst = 0.0
        cgst_total += line_cgst
        sgst_total += line_sgst
        igst_total += line_igst
        line_items.append(
            {
                "name": product.name,
                "sku": variant.sku,
                "hsn": product.hsn_code,
                "gst_rate": gst_rate,
                "weight_kg": variant.weight_kg,
                "quantity": item.quantity,
                "unit_price": money(item.unit_price),
                "amount": round(amount, 2),
                "cgst": line_cgst,
                "sgst": line_sgst,
                "igst": line_igst,
            }
        )
    cgst = round(cgst_total, 2)
    sgst = round(sgst_total, 2)
    igst = round(igst_total, 2)
    return {
        "invoice_number": invoice.invoice_number,
        "invoice_date": invoice.invoice_date.isoformat(),
        "status": invoice.status,
        "seller": seller,
        "billing_address": order.billing_address_text or order.address_text,
        "shipping_address": order.address_text,
        "customer_phone": order.customer_phone,
        "order_number": order.order_number,
        "order_date": order.created_at.isoformat() if order.created_at else None,
        "items": line_items,
        "subtotal": money(order.subtotal),
        "discount_total": money(order.discount_total),
        "delivery_charge": money(order.delivery_charge),
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "total": money(order.total),
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
    }


def render_invoice_pdf(payload: dict) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 48
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(40, y, "Tax Invoice")
    pdf.setFont("Helvetica", 10)
    y -= 24
    pdf.drawString(40, y, f"Invoice: {payload['invoice_number']}")
    pdf.drawString(330, y, f"Date: {payload['invoice_date'][:10]}")
    y -= 28
    seller = payload["seller"]
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(40, y, str(seller.get("legal_name") or "WheatRaja"))
    pdf.setFont("Helvetica", 9)
    y -= 14
    pdf.drawString(40, y, str(seller.get("address") or ""))
    y -= 14
    pdf.drawString(40, y, f"GSTIN: {seller.get('gstin') or 'Not configured'}")
    y -= 28
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(40, y, "Bill To / Ship To")
    y -= 14
    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, y, f"Phone: {payload.get('customer_phone') or ''}")
    y -= 14
    pdf.drawString(40, y, f"Billing: {payload.get('billing_address') or ''}"[:110])
    y -= 14
    pdf.drawString(40, y, f"Shipping: {payload.get('shipping_address') or ''}"[:110])
    y -= 28
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y, "Item")
    pdf.drawString(255, y, "HSN")
    pdf.drawString(320, y, "GST")
    pdf.drawRightString(390, y, "Qty")
    pdf.drawRightString(465, y, "Rate")
    pdf.drawRightString(545, y, "Amount")
    pdf.line(40, y - 4, 555, y - 4)
    y -= 18
    pdf.setFont("Helvetica", 9)
    for item in payload["items"]:
        pdf.drawString(40, y, f"{item['name']} {item['weight_kg']}kg"[:36])
        pdf.drawString(255, y, str(item.get("hsn") or "-")[:14])
        pdf.drawString(320, y, f"{float(item.get('gst_rate') or 0):.2f}%")
        pdf.drawRightString(390, y, str(item["quantity"]))
        pdf.drawRightString(465, y, f"{item['unit_price']:.2f}")
        pdf.drawRightString(545, y, f"{item['amount']:.2f}")
        y -= 16
        if y < 120:
            pdf.showPage()
            y = height - 48
    y -= 12
    rows = [
        ("Subtotal", payload["subtotal"]),
        ("Discount", -payload["discount_total"]),
        ("Delivery", payload["delivery_charge"]),
        ("CGST", payload["cgst"]),
        ("SGST", payload["sgst"]),
        ("IGST", payload["igst"]),
        ("Total", payload["total"]),
    ]
    for label, value in rows:
        pdf.setFont("Helvetica-Bold" if label == "Total" else "Helvetica", 10)
        pdf.drawRightString(465, y, label)
        pdf.drawRightString(545, y, f"{float(value):.2f}")
        y -= 16
    pdf.setFont("Helvetica", 8)
    pdf.drawString(40, 48, "This is a computer-generated invoice.")
    pdf.save()
    return buffer.getvalue()
