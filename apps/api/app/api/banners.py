from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin_permission
from app.core.database import get_db
from app.models.entities import Banner
from app.schemas.commerce import BannerIn, BannerOut

router = APIRouter(prefix="/banners", tags=["banners"])


@router.get("", response_model=list[BannerOut])
def list_banners(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return (
        db.query(Banner)
        .filter(Banner.active == True)
        .filter((Banner.starts_at == None) | (Banner.starts_at <= now))
        .filter((Banner.ends_at == None) | (Banner.ends_at >= now))
        .order_by(Banner.display_order.asc(), Banner.created_at.desc())
        .offset(skip)
        .limit(min(limit, 200))
        .all()
    )


@router.post("", response_model=BannerOut)
def create_banner(payload: BannerIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    banner = Banner(**payload.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/{banner_id}")
def delete_banner(banner_id: int, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    banner = db.query(Banner).filter_by(id=banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(banner)
    db.commit()
    return {"ok": True, "id": banner_id}


@router.patch("/{banner_id}", response_model=BannerOut)
def update_banner(banner_id: int, payload: BannerIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    banner = db.query(Banner).filter_by(id=banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    for key, value in payload.model_dump().items():
        setattr(banner, key, value)
    db.commit()
    db.refresh(banner)
    return banner
