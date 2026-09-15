from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.auth_deps import require_admin, require_admin_permission, require_user
from app.core.database import get_db
from app.models.entities import Address, AdminAuditLog, Role, User, UserRole
from app.services.store import get_or_create_user

router = APIRouter(prefix="/users", tags=["users"])


class ProfileIn(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=160)


class AddressIn(BaseModel):
    label: str = Field(min_length=2, max_length=80)
    line1: str = Field(min_length=8, max_length=240)
    city: str = "Noida"
    pincode: str = Field(min_length=6, max_length=12)
    distance_km: float | None = None
    is_default: bool = False


class AdminCustomerIn(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=160)
    blocked: bool = False
    admin_notes: str | None = None


class AdminAccountIn(AdminCustomerIn):
    role: str = Field(default="customer", pattern="^(customer|admin)$")
    role_ids: list[int] = Field(default_factory=list)


@router.get("/admin/accounts")
def admin_accounts(admin: dict = Depends(require_admin_permission("rbac.write")), db: Session = Depends(get_db)):
    return [{"id": row.id, "phone": row.phone, "name": row.name, "email": row.email, "role": row.role, "blocked": row.blocked, "admin_notes": row.admin_notes,
             "role_ids": [link.role_id for link in db.query(UserRole).filter_by(user_id=row.id).all()]}
            for row in db.query(User).order_by(User.id.desc()).limit(500).all()]


@router.post("/admin/accounts")
def save_admin_account(payload: AdminAccountIn, admin: dict = Depends(require_admin_permission("rbac.write")), db: Session = Depends(get_db)):
    if payload.phone == admin["sub"]:
        raise HTTPException(status_code=409, detail="Use your profile to edit yourself; another administrator must change your access")
    roles = db.query(Role).filter(Role.id.in_(payload.role_ids)).all() if payload.role_ids else []
    if len(roles) != len(set(payload.role_ids)):
        raise HTTPException(status_code=422, detail="Unknown role selected")
    if payload.role == "customer" and any(role.name != "customer" for role in roles):
        raise HTTPException(status_code=422, detail="Customer accounts cannot receive staff roles")
    actor = db.query(User).filter_by(phone=admin["sub"]).first()
    actor_super = db.query(UserRole).join(Role).filter(UserRole.user_id == actor.id, Role.name == "superadmin").first()
    existing = db.query(User).filter_by(phone=payload.phone).first()
    existing_super = existing and db.query(UserRole).join(Role).filter(UserRole.user_id == existing.id, Role.name == "superadmin").first()
    if (existing_super or any(role.name == "superadmin" for role in roles)) and not actor_super:
        raise HTTPException(status_code=403, detail="Only a superadmin can manage superadmin access")
    row = get_or_create_user(db, payload.phone, "customer")
    for key, value in payload.model_dump(exclude={"role_ids"}).items():
        setattr(row, key, value)
    db.query(UserRole).filter_by(user_id=row.id).delete()
    for role in roles:
        db.add(UserRole(user_id=row.id, role_id=role.id))
    db.add(AdminAuditLog(admin_id=actor.id, action="user_access_update", entity=f"user:{row.id}", metadata_json="{}"))
    db.commit()
    return {"id": row.id, "phone": row.phone, "role": row.role, "blocked": row.blocked}


@router.patch("/me")
def update_profile(payload: ProfileIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    record.name = payload.name
    record.email = payload.email
    if payload.name:
        record.profile_complete = True
    db.commit()
    return {"phone": record.phone, "name": record.name, "email": record.email, "profile_complete": record.profile_complete, "referral_code": record.referral_code}


@router.get("/addresses")
def list_addresses(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    return [{"id": row.id, "label": row.label, "line1": row.line1, "city": row.city, "pincode": row.pincode, "distance_km": row.distance_km, "is_default": row.is_default} for row in db.query(Address).filter_by(user_id=record.id).all()]


@router.post("/addresses")
def add_address(payload: AddressIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    if payload.is_default:
        for row in db.query(Address).filter_by(user_id=record.id).all():
            row.is_default = False
    address = Address(user_id=record.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return {"id": address.id, "label": address.label, "line1": address.line1, "city": address.city, "pincode": address.pincode, "distance_km": address.distance_km, "is_default": address.is_default}


@router.patch("/addresses/{address_id}")
def update_address(address_id: int, payload: AddressIn, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    address = db.query(Address).filter_by(id=address_id, user_id=record.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    if payload.is_default:
        for row in db.query(Address).filter_by(user_id=record.id).all():
            row.is_default = False
    for key, value in payload.model_dump().items():
        setattr(address, key, value)
    db.commit()
    return {"id": address.id, "label": address.label, "line1": address.line1, "city": address.city, "pincode": address.pincode, "distance_km": address.distance_km, "is_default": address.is_default}


@router.delete("/addresses/{address_id}")
def delete_address(address_id: int, user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user["sub"], user.get("role", "customer"))
    address = db.query(Address).filter_by(id=address_id, user_id=record.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
    return {"ok": True, "id": address_id}


@router.post("/admin/customers")
def admin_upsert_customer(payload: AdminCustomerIn, admin: dict = Depends(require_admin_permission("users.write")), db: Session = Depends(get_db)):
    existing = db.query(User).filter_by(phone=payload.phone).first()
    if existing and existing.role == "admin":
        raise HTTPException(status_code=403, detail="Manage staff accounts from Users with access-management permission")
    record = get_or_create_user(db, payload.phone, "customer")
    record.name = payload.name
    record.email = payload.email
    record.blocked = payload.blocked
    record.admin_notes = payload.admin_notes
    record.profile_complete = bool(payload.name) or record.profile_complete
    db.commit()
    db.refresh(record)
    return {"id": record.id, "phone": record.phone, "name": record.name, "email": record.email, "blocked": record.blocked, "admin_notes": record.admin_notes}


@router.get("/admin/customers/{phone}")
def admin_customer_detail(phone: str, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    record = db.query(User).filter_by(phone=phone).first()
    if not record:
        raise HTTPException(status_code=404, detail="Customer not found")
    addresses = db.query(Address).filter_by(user_id=record.id).all()
    return {
        "id": record.id,
        "phone": record.phone,
        "name": record.name,
        "email": record.email,
        "blocked": record.blocked,
        "admin_notes": record.admin_notes,
        "addresses": [{"id": row.id, "label": row.label, "line1": row.line1, "city": row.city, "pincode": row.pincode, "is_default": row.is_default} for row in addresses],
    }
