from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import ContactInquiry

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    message: str = Field(min_length=5, max_length=1000)


@router.post("")
def create_inquiry(payload: ContactIn, db: Session = Depends(get_db)):
    inquiry = ContactInquiry(name=payload.name, phone=payload.phone, message=payload.message)
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return {"id": inquiry.id, "status": inquiry.status, "message": "Inquiry received"}
