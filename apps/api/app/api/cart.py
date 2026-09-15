from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_user
from app.core.database import get_db
from app.models.entities import Cart, CartItem
from app.services.store import get_or_create_user, money, variant_by_slug_weight

router = APIRouter(prefix="/cart", tags=["cart"])


class CartItemIn(BaseModel):
    slug: str
    weight_kg: int = Field(ge=1)
    quantity: int = Field(ge=1, le=20)
    subscription: bool = False


class CartQuantityIn(BaseModel):
    quantity: int = Field(ge=0, le=20)


def get_cart_record(db: Session, phone: str, role: str = "customer") -> Cart:
    user = get_or_create_user(db, phone, role)
    cart = db.query(Cart).filter_by(user_id=user.id).first()
    if not cart:
        cart = Cart(user_id=user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def serialize_cart(cart: Cart) -> dict:
    rows = []
    subtotal = 0.0
    for item in cart_items(cart):
        variant = item.variant
        product = variant.product
        unit_price = money(variant.price) * (0.9 if item.subscription else 1)
        line_total = unit_price * item.quantity
        subtotal += line_total
        rows.append({
            "id": item.id,
            "slug": product.slug,
            "name": product.name,
            "weight_kg": variant.weight_kg,
            "quantity": item.quantity,
            "subscription": item.subscription,
            "unit_price": round(unit_price, 2),
            "line_total": round(line_total, 2)
        })
    return {"items": rows, "subtotal": round(subtotal, 2)}


def cart_items(cart: Cart):
    return sorted(cart.cart_items if hasattr(cart, "cart_items") else cart_items_query(cart), key=lambda item: item.id)


def cart_items_query(cart: Cart):
    return cart.__dict__.get("_items", [])


@router.get("")
def get_cart(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    cart = get_cart_record(db, user["sub"], user.get("role", "customer"))
    items = db.query(CartItem).filter_by(cart_id=cart.id).all()
    cart.__dict__["_items"] = items
    return serialize_cart(cart)


@router.post("/items")
def add_item(payload: CartItemIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    cart = get_cart_record(db, user["sub"], user.get("role", "customer"))
    variant = variant_by_slug_weight(db, payload.slug, payload.weight_kg)
    if not variant:
        raise HTTPException(status_code=400, detail="Invalid product variant")
    existing = db.query(CartItem).filter_by(cart_id=cart.id, variant_id=variant.id, subscription=payload.subscription).first()
    if existing:
        existing.quantity = min(20, existing.quantity + payload.quantity)
    else:
        db.add(CartItem(cart_id=cart.id, variant_id=variant.id, quantity=payload.quantity, subscription=payload.subscription))
    db.commit()
    return get_cart(user, db)


@router.patch("/items/{item_id}")
def update_item(item_id: int, payload: CartQuantityIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    cart = get_cart_record(db, user["sub"], user.get("role", "customer"))
    item = db.query(CartItem).filter_by(id=item_id, cart_id=cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = payload.quantity
    db.commit()
    return get_cart(user, db)


@router.delete("/items/{item_id}")
def delete_item(item_id: int, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    return update_item(item_id, CartQuantityIn(quantity=0), user, db)


@router.delete("")
def clear_cart(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    cart = get_cart_record(db, user["sub"], user.get("role", "customer"))
    for item in db.query(CartItem).filter_by(cart_id=cart.id).all():
        db.delete(item)
    db.commit()
    return {"items": [], "subtotal": 0}
