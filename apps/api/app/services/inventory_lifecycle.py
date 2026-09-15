from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Inventory, InventoryReservation, Order, ProductVariant, StockMovement


RESERVATION_MINUTES = 20


def reserve_order_inventory(db: Session, order: Order, lines: list[tuple[object, object, float]]) -> None:
    expires_at = datetime.utcnow() + timedelta(minutes=RESERVATION_MINUTES)
    for item, variant, _unit_price in lines:
        inventory = db.query(Inventory).filter_by(variant_id=variant.id).with_for_update().first()
        if not inventory:
            inventory = Inventory(variant_id=variant.id, available=variant.inventory or 0, reserved=0)
            db.add(inventory)
            db.flush()
        if inventory.available < item.quantity:
            raise HTTPException(status_code=409, detail=f"Only {inventory.available} units available for {variant.product.name} {variant.weight_kg} KG")
    for item, variant, _unit_price in lines:
        inventory = db.query(Inventory).filter_by(variant_id=variant.id).first()
        inventory.available -= item.quantity
        inventory.reserved += item.quantity
        db.add(InventoryReservation(order_id=order.id, variant_id=variant.id, quantity=item.quantity, status="reserved", expires_at=expires_at))
        db.add(StockMovement(variant_id=variant.id, quantity=item.quantity, movement_type="reserve", reason=f"order:{order.order_number}"))


def commit_order_inventory(db: Session, order: Order) -> None:
    reservations = db.query(InventoryReservation).filter_by(order_id=order.id, status="reserved").all()
    for reservation in reservations:
        inventory = db.query(Inventory).filter_by(variant_id=reservation.variant_id).first()
        if inventory:
            inventory.reserved = max(0, int(inventory.reserved or 0) - reservation.quantity)
            variant = db.query(ProductVariant).filter_by(id=reservation.variant_id).first()
            if variant:
                variant.inventory = max(0, int(inventory.available or 0))
        reservation.status = "committed"
        reservation.committed_at = datetime.utcnow()
        db.add(StockMovement(variant_id=reservation.variant_id, quantity=-reservation.quantity, movement_type="out", reason=f"paid:{order.order_number}"))


def release_order_inventory(db: Session, order: Order, reason: str = "released") -> None:
    reservations = db.query(InventoryReservation).filter_by(order_id=order.id, status="reserved").all()
    for reservation in reservations:
        inventory = db.query(Inventory).filter_by(variant_id=reservation.variant_id).first()
        if inventory:
            inventory.available += reservation.quantity
            inventory.reserved = max(0, int(inventory.reserved or 0) - reservation.quantity)
            variant = db.query(ProductVariant).filter_by(id=reservation.variant_id).first()
            if variant:
                variant.inventory = int(inventory.available or 0)
        reservation.status = "released"
        reservation.released_at = datetime.utcnow()
        db.add(StockMovement(variant_id=reservation.variant_id, quantity=reservation.quantity, movement_type="release", reason=f"{reason}:{order.order_number}"))


def release_expired_reservations(db: Session) -> int:
    now = datetime.utcnow()
    reservations = db.query(InventoryReservation).filter(InventoryReservation.status == "reserved", InventoryReservation.expires_at <= now).all()
    order_ids = {reservation.order_id for reservation in reservations}
    for order_id in order_ids:
        order = db.query(Order).filter_by(id=order_id).first()
        if order and order.payment_status in {"pending_payment", "payment_failed"}:
            order.payment_status = "reservation_expired"
            release_order_inventory(db, order, "expired")
    db.commit()
    return len(reservations)


def restock_returned_order(db: Session, order: Order) -> None:
    """Restore committed stock once, after a return is physically received."""
    for reservation in db.query(InventoryReservation).filter_by(order_id=order.id, status="committed").with_for_update().all():
        inventory = db.query(Inventory).filter_by(variant_id=reservation.variant_id).with_for_update().first()
        if inventory:
            inventory.available += reservation.quantity
            variant = db.query(ProductVariant).filter_by(id=reservation.variant_id).first()
            if variant:
                variant.inventory = inventory.available
        reservation.status = "restocked"
        reservation.released_at = datetime.utcnow()
        db.add(StockMovement(variant_id=reservation.variant_id, quantity=reservation.quantity, movement_type="return", reason=f"return_restock:{order.order_number}"))
