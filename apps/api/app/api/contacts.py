from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission
from app.core.database import get_db
from app.models.entities import Contact
from app.schemas.commerce import ContactIn, ContactOut

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactOut])
def list_contacts(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Contact).order_by(Contact.created_at.desc()).offset(skip).limit(min(limit, 200)).all()


@router.post("", response_model=ContactOut)
def create_contact(payload: ContactIn, db: Session = Depends(get_db)):
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact_status(contact_id: int, status: str, admin: dict = Depends(require_admin_permission("users.write")), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter_by(id=contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact.status = status
    db.commit()
    db.refresh(contact)
    return contact
