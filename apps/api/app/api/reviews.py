from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import AdminAuditLog, Order, OrderItem, Product, Review
from app.services.store import get_or_create_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewIn(BaseModel):
    slug: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=800)


class ReviewModeration(BaseModel):
    approved: bool


def serialize_review(review: Review) -> dict:
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "approved": review.approved,
        "created_at": review.created_at.isoformat() if review.created_at else None
    }


@router.get("")
def list_reviews(approved_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Review)
    if approved_only:
        query = query.filter_by(approved=True)
    return [serialize_review(review) for review in query.order_by(Review.created_at.desc()).limit(100).all()]


@router.post("")
def create_review(payload: ReviewIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    product = db.query(Product).filter_by(slug=payload.slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    verified = (
        db.query(OrderItem)
        .join(Order)
        .filter(Order.user_id == record.id, Order.payment_status.in_(["paid", "demo_paid"]), OrderItem.variant.has(product_id=product.id))
        .first()
    )
    review = Review(user_id=record.id, product_id=product.id, rating=payload.rating, comment=payload.comment, approved=bool(verified))
    db.add(review)
    db.commit()
    db.refresh(review)
    return {**serialize_review(review), "verified_purchase": bool(verified)}


@router.patch("/{review_id}")
def moderate_review(review_id: int, payload: ReviewModeration, admin: dict = Depends(require_admin_permission("reviews:moderate")), db: Session = Depends(get_db)):
    review = db.query(Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.approved = payload.approved
    db.add(AdminAuditLog(admin_id=get_or_create_user(db, admin["sub"], "admin").id, action="review_moderate", entity=f"review:{review.id}", metadata_json="{}"))
    db.commit()
    return serialize_review(review)


@router.delete("/{review_id}")
def delete_review(review_id: int, admin: dict = Depends(require_admin_permission("reviews:moderate")), db: Session = Depends(get_db)):
    review = db.query(Review).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.add(AdminAuditLog(admin_id=get_or_create_user(db, admin["sub"], "admin").id, action="review_delete", entity=f"review:{review.id}", metadata_json="{}"))
    db.delete(review)
    db.commit()
    return {"deleted": True}
