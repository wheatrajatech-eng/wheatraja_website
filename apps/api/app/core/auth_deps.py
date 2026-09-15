from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.entities import Permission, Role, RolePermission, User, UserRole


def decode_access_token(token: str | None) -> dict:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc


def require_user(wr_access: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> dict:
    payload = decode_access_token(wr_access)
    record = db.query(User).filter_by(phone=payload.get("sub")).first()
    if not record or record.blocked:
        raise HTTPException(status_code=403, detail="Account unavailable")
    return {**payload, "role": record.role}


def require_admin(wr_access: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> dict:
    payload = decode_access_token(wr_access)
    if payload.get("role") not in {"admin", "superadmin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return _require_admin_record(payload, db)


def _require_admin_record(payload: dict, db: Session) -> dict:
    record = db.query(User).filter_by(phone=payload.get("sub")).first()
    if not record or record.blocked or record.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return {**payload, "role": record.role}


def has_permission(db: Session, phone: str, permission_key: str) -> bool:
    permission_key = {"products.write": "products:write", "orders.write": "orders:write"}.get(permission_key, permission_key)
    user = db.query(User).filter_by(phone=phone).first()
    if not user:
        return False
    permission = db.query(Permission).filter_by(key=permission_key).first()
    if not permission:
        return not settings.enforce_rbac_permissions
    role_ids = [row.role_id for row in db.query(UserRole).filter_by(user_id=user.id).all()]
    if not role_ids:
        return not settings.enforce_rbac_permissions and user.role == "admin"
    return db.query(RolePermission).filter(RolePermission.role_id.in_(role_ids), RolePermission.permission_id == permission.id).first() is not None


def require_admin_permission(permission_key: str):
    def dependency(wr_access: str | None = Cookie(default=None), db: Session = Depends(get_db)) -> dict:
        payload = require_admin(wr_access, db)
        super_role = db.query(UserRole).join(Role, Role.id == UserRole.role_id).join(User, User.id == UserRole.user_id).filter(User.phone == payload["sub"], Role.name == "superadmin").first()
        if super_role:
            return payload
        if not has_permission(db, payload.get("sub"), permission_key):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission required: {permission_key}")
        return payload

    return dependency
