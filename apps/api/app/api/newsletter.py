from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin
from app.core.database import get_db
from app.models.entities import NewsletterSubscriber
from app.schemas.commerce import NewsletterIn, NewsletterOut

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.get("", response_model=list[NewsletterOut])
def list_subscribers(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc()).offset(skip).limit(min(limit, 200)).all()


@router.post("", response_model=NewsletterOut)
def subscribe(payload: NewsletterIn, db: Session = Depends(get_db)):
    subscriber = db.query(NewsletterSubscriber).filter_by(email=payload.email).first()
    if subscriber:
        subscriber.active = True
    else:
        subscriber = NewsletterSubscriber(email=payload.email, active=True)
        db.add(subscriber)
    db.commit()
    db.refresh(subscriber)
    return subscriber
