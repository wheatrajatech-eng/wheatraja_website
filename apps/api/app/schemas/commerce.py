from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CategoryOut(OrmModel):
    id: int
    slug: str
    name: str
    parent_id: int | None = None
    active: bool


class CategoryIn(BaseModel):
    slug: str = Field(min_length=2, max_length=120)
    name: str = Field(min_length=2, max_length=160)
    parent_id: int | None = None
    active: bool = True


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    subject: str | None = Field(default=None, max_length=180)
    message: str = Field(min_length=5, max_length=1000)


class ContactOut(OrmModel):
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    subject: str | None = None
    message: str
    status: str


class NewsletterIn(BaseModel):
    email: EmailStr


class NewsletterOut(OrmModel):
    id: int
    email: str
    active: bool


class BannerIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    subtitle: str | None = Field(default=None, max_length=260)
    image_url: str | None = Field(default=None, max_length=500)
    cta_text: str | None = Field(default=None, max_length=80)
    link_url: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    active: bool = True


class BannerOut(OrmModel):
    id: int
    title: str
    subtitle: str | None = None
    image_url: str | None = None
    cta_text: str | None = None
    link_url: str | None = None
    display_order: int = 0
    active: bool


class SettingIn(BaseModel):
    key: str = Field(min_length=2, max_length=120)
    value: str


class SettingOut(OrmModel):
    id: int
    key: str
    value: str
