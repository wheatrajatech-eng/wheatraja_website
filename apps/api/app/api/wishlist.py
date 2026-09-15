from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.cart import CartItemIn, add_item
from app.core.auth_deps import require_user
from app.core.database import get_db
from app.models.entities import Product, Wishlist
from app.services.store import get_or_create_user, serialize_product

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


class WishlistIn(BaseModel):
    slug: str


class MoveToCartIn(BaseModel):
    slug: str
    weight_kg: int = 5
    quantity: int = 1


@router.get("")
def get_wishlist(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    rows = db.query(Wishlist).filter_by(user_id=record.id).order_by(Wishlist.created_at.desc()).all()
    products = [db.query(Product).filter_by(id=row.product_id).first() for row in rows]
    return [serialize_product(product) for product in products if product]


@router.post("")
def add_wishlist(payload: WishlistIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    product = db.query(Product).filter_by(slug=payload.slug, active=True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not db.query(Wishlist).filter_by(user_id=record.id, product_id=product.id).first():
        db.add(Wishlist(user_id=record.id, product_id=product.id))
        db.commit()
    return get_wishlist(user, db)


@router.delete("/{slug}")
def remove_wishlist(slug: str, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    product = db.query(Product).filter_by(slug=slug).first()
    if product:
        row = db.query(Wishlist).filter_by(user_id=record.id, product_id=product.id).first()
        if row:
            db.delete(row)
            db.commit()
    return get_wishlist(user, db)


@router.post("/move-to-cart")
def move_to_cart(payload: MoveToCartIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    add_item(CartItemIn(slug=payload.slug, weight_kg=payload.weight_kg, quantity=payload.quantity), user, db)
    remove_wishlist(payload.slug, user, db)
    return {"moved": True, "wishlist": get_wishlist(user, db)}
