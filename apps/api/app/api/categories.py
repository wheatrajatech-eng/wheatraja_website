from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin_permission
from app.core.database import get_db
from app.models.entities import Category
from app.schemas.commerce import CategoryIn, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = db.query(Category).filter_by(active=True).order_by(Category.name.asc()).offset(skip).limit(min(limit, 200)).all()
    return [
        {
            "id": category.id,
            "slug": category.slug,
            "name": category.name,
            "parent_id": category.parent_id,
            "active": category.active
        }
        for category in categories
    ]


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryIn, admin: dict = Depends(require_admin_permission("products.write")), db: Session = Depends(get_db)):
    existing = db.query(Category).filter_by(slug=payload.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category slug already exists")
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryIn, admin: dict = Depends(require_admin_permission("products.write")), db: Session = Depends(get_db)):
    category = db.query(Category).filter_by(id=category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category
