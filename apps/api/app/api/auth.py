from datetime import datetime, timedelta, timezone
import secrets
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.core.auth_deps import require_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_token
from app.models.entities import LoginHistory, User
from app.services.email_service import EmailService
from app.services.otp import generate_otp, send_otp, verify_otp as verify_remote_otp
from app.services.store import generate_referral_code, get_or_create_user, wallet_balance

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
OTP_STORE: dict[str, dict] = {}


class OTPRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)


class SignupRequest(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    name: str = Field(min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=160)


class OTPVerify(BaseModel):
    phone: str
    otp: str = Field(min_length=4, max_length=6)


class ForgotPasswordIn(BaseModel):
    email: str = Field(min_length=5, max_length=160)


def admin_phones() -> set[str]:
    return {phone.strip() for phone in settings.admin_phone_numbers.split(",") if phone.strip()}


def queue_otp(phone: str, purpose: str, db: Session | None = None, extra: dict | None = None) -> dict:
    if settings.environment == "production" and settings.allow_dev_otp:
        raise HTTPException(status_code=500, detail="Static development OTP is disabled in production")
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    otp = generate_otp()
    try:
        send_otp(phone, otp)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    email = (extra or {}).get("email")
    if not email and db is not None:
        existing = db.query(User).filter_by(phone=phone).first()
        email = existing.email if existing else None
    if email and db is not None:
        EmailService(db).send_otp_email(email, otp)
    OTP_STORE[phone] = {"otp": otp, "expires": expires, "attempts": 0, "purpose": purpose, **(extra or {})}
    response = {"message": "OTP queued", "phone": phone, "ttl_seconds": 300}
    if settings.environment != "production" and settings.allow_dev_otp:
        response["dev_otp"] = settings.otp_dev_code
    return response


@router.post("/otp/request")
@limiter.limit("5/minute")
def request_otp(request: Request, payload: OTPRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    existing = db.query(User).filter_by(phone=phone).first()
    if phone not in admin_phones() and (not existing or not existing.profile_complete):
        raise HTTPException(status_code=404, detail="No account found for this phone. Please sign up first.")
    response = queue_otp(phone, "login", db)
    response["account_exists"] = True
    return response


@router.post("/signup/request")
@limiter.limit("5/minute")
def signup_request(request: Request, payload: SignupRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    existing = db.query(User).filter_by(phone=phone).first()
    if phone in admin_phones():
        raise HTTPException(status_code=400, detail="Admin phone numbers must use login.")
    if existing and existing.profile_complete and existing.role == "customer":
        raise HTTPException(status_code=409, detail="Account already exists. Please login with OTP.")
    response = queue_otp(phone, "signup", db, {"name": payload.name.strip(), "email": payload.email.strip() if payload.email else None})
    response["account_exists"] = False
    return response


@router.post("/otp/verify")
@limiter.limit("10/minute")
def verify_otp(request: Request, payload: OTPVerify, response: Response, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    record = OTP_STORE.get(phone)
    if not record or record["expires"] < datetime.now(timezone.utc):
        db.add(LoginHistory(phone=phone, ip_address=get_remote_address(request), user_agent=request.headers.get("user-agent"), success=False))
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired or not requested")
    record["attempts"] += 1
    if record["attempts"] > 5:
        OTP_STORE.pop(phone, None)
        db.add(LoginHistory(phone=phone, ip_address=get_remote_address(request), user_agent=request.headers.get("user-agent"), success=False))
        db.commit()
        raise HTTPException(status_code=429, detail="Too many OTP attempts")
    try:
        valid = verify_remote_otp(phone, payload.otp) if settings.otp_provider == "twilio" else payload.otp == record["otp"]
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not valid:
        db.add(LoginHistory(phone=phone, ip_address=get_remote_address(request), user_agent=request.headers.get("user-agent"), success=False))
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    OTP_STORE.pop(phone, None)

    role = "admin" if phone in admin_phones() else "customer"
    if record.get("purpose") == "signup" and role == "customer":
        user = db.query(User).filter_by(phone=phone).first()
        if not user:
            user = User(phone=phone, role="customer", referral_code=generate_referral_code(db), wallet_active=True)
            db.add(user)
        user.name = record.get("name")
        user.email = record.get("email")
        user.profile_complete = True
        user.signup_completed_at = user.signup_completed_at or datetime.utcnow()
        if user.email:
            EmailService(db).send_welcome_coupon_email(user.email)
    else:
        if role == "customer":
            user = db.query(User).filter_by(phone=phone).first()
            if not user or not user.profile_complete:
                raise HTTPException(status_code=404, detail="No account found for this phone. Please sign up first.")
        else:
            user = get_or_create_user(db, phone, role)

    user.last_login_at = datetime.utcnow()
    db.add(LoginHistory(user_id=user.id, phone=phone, ip_address=get_remote_address(request), user_agent=request.headers.get("user-agent"), success=True))
    db.commit()
    db.refresh(user)

    token = create_token(subject=phone, role=role)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie("wr_access", token, httponly=True, secure=settings.environment == "production", samesite="lax", max_age=1800)
    response.set_cookie("wr_csrf", csrf_token, httponly=False, secure=settings.environment == "production", samesite="lax", max_age=1800)
    return {
        "authenticated": True,
        "role": role,
        "phone": user.phone,
        "name": user.name,
        "email": user.email,
        "profile_complete": user.profile_complete,
        "referral_code": user.referral_code
    }


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    record = db.query(User).filter(User.email == payload.email.strip()).first()
    if record and record.email:
        EmailService(db).send_forgot_password_email(record.email, record.phone)
        db.commit()
    return {"message": "If an account exists for this email, account access instructions have been sent."}


@router.get("/csrf")
def csrf(response: Response):
    token = secrets.token_urlsafe(32)
    response.set_cookie("wr_csrf", token, httponly=False, secure=settings.environment == "production", samesite="lax", max_age=1800)
    return {"csrf_token": token}


@router.get("/me")
def me(user: dict = Depends(require_user), db: Session = Depends(get_db)):
    record = get_or_create_user(db, user.get("sub"), user.get("role", "customer"))
    return {
        "phone": record.phone,
        "role": record.role,
        "name": record.name,
        "email": record.email,
        "profile_complete": record.profile_complete,
        "referral_code": record.referral_code,
        "wallet_points": wallet_balance(db, record.id)
    }


@router.get("/session")
def session(wr_access: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not wr_access:
        return {"authenticated": False}
    try:
        payload = jwt.decode(wr_access, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return {"authenticated": False}
    record = db.query(User).filter_by(phone=payload.get("sub")).first()
    if not record or record.blocked:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "phone": record.phone,
        "role": record.role,
        "name": record.name,
        "email": record.email,
        "profile_complete": record.profile_complete,
        "referral_code": record.referral_code,
        "wallet_points": wallet_balance(db, record.id)
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("wr_access")
    response.delete_cookie("wr_csrf")
    return {"authenticated": False}
