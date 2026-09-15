from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission
from app.core.database import get_db
from app.models.entities import Setting
from app.schemas.commerce import SettingIn, SettingOut

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=list[SettingOut])
def list_settings(skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Setting).order_by(Setting.key.asc()).offset(skip).limit(min(limit, 200)).all()


@router.post("", response_model=SettingOut)
def upsert_setting(payload: SettingIn, admin: dict = Depends(require_admin_permission("settings:write")), db: Session = Depends(get_db)):
    setting = db.query(Setting).filter_by(key=payload.key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = Setting(**payload.model_dump())
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.get("/{key}", response_model=SettingOut)
def get_setting(key: str, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    setting = db.query(Setting).filter_by(key=key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting
