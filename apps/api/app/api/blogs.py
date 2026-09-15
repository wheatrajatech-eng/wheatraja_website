import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth_deps import require_admin, require_admin_permission
from app.core.database import get_db
from app.models.entities import BlogPost

router = APIRouter(prefix="/blogs", tags=["blogs"])
BLOG_STATUSES = {"draft", "scheduled", "published", "archived"}


class BlogIn(BaseModel):
    slug: str = Field(min_length=2, max_length=140)
    title: str = Field(min_length=2, max_length=200)
    excerpt: str = Field(min_length=2, max_length=300)
    body: str = Field(min_length=2)
    category: str = "Blog"
    read_time: str | None = "4 min read"
    cover_image_url: str | None = None
    published: bool | None = None
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    author_name: str | None = Field(default="WheatRaja Team", max_length=120)
    tags: list[str] = Field(default_factory=list)
    gallery: list[str] = Field(default_factory=list)
    inline_images: list[str] = Field(default_factory=list)
    featured: bool = False
    pinned_rank: int = Field(default=100, ge=0, le=9999)
    status: str = Field(default="draft", pattern="^(draft|scheduled|published|archived)$")
    scheduled_publish_at: datetime | None = None
    published_at: datetime | None = None
    content_format: str = Field(default="markdown", pattern="^markdown$")
    meta_keywords: str | None = Field(default=None, max_length=300)


class ScheduleIn(BaseModel):
    scheduled_publish_at: datetime


def parse_json_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except (TypeError, ValueError):
        return []
    return [str(item) for item in value] if isinstance(value, list) else []


def clean_list(values: list[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        item = value.strip()
        key = item.lower()
        if item and key not in seen:
            seen.add(key)
            output.append(item[:120])
    return output


def apply_payload(post: BlogPost, payload: BlogIn) -> None:
    for key, value in payload.model_dump(exclude={"tags", "gallery", "inline_images"}).items():
        setattr(post, key, value)
    post.tags_json = json.dumps(clean_list(payload.tags))
    post.gallery_json = json.dumps(clean_list(payload.gallery))
    post.inline_images_json = json.dumps(clean_list(payload.inline_images))
    if payload.status == "published":
        post.published = True
        post.published_at = payload.published_at or post.published_at or datetime.utcnow()
        post.scheduled_publish_at = None
    elif payload.status == "scheduled":
        post.published = False
        post.published_at = None
    else:
        post.published = False
        post.published_at = payload.published_at


def serialize_blog(post: BlogPost) -> dict:
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "body": post.body,
        "category": post.category,
        "read_time": post.read_time,
        "cover_image_url": post.cover_image_url,
        "published": post.status == "published",
        "seo_title": post.seo_title,
        "seo_description": post.seo_description,
        "author_name": post.author_name,
        "tags": parse_json_list(post.tags_json),
        "gallery": parse_json_list(post.gallery_json),
        "inline_images": parse_json_list(post.inline_images_json),
        "featured": post.featured,
        "pinned_rank": post.pinned_rank,
        "status": post.status,
        "scheduled_publish_at": post.scheduled_publish_at.isoformat() if post.scheduled_publish_at else None,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "content_format": post.content_format,
        "meta_keywords": post.meta_keywords,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


def public_query(db: Session):
    now = datetime.utcnow()
    return db.query(BlogPost).filter(
        or_(
            (BlogPost.status == "published") & (BlogPost.published_at <= now),
            (BlogPost.status == "scheduled") & (BlogPost.scheduled_publish_at <= now),
        )
    )


def ordered(query):
    return query.order_by(BlogPost.featured.desc(), BlogPost.pinned_rank.asc(), BlogPost.published_at.desc(), BlogPost.created_at.desc())


@router.get("")
def list_blogs(skip: int = 0, limit: int = 100, category: str | None = None, tag: str | None = None, q: str | None = None, db: Session = Depends(get_db)):
    query = public_query(db)
    if category:
        query = query.filter(BlogPost.category == category)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(BlogPost.title.ilike(term), BlogPost.excerpt.ilike(term), BlogPost.body.ilike(term)))
    posts = ordered(query).offset(skip).limit(min(limit, 200)).all()
    rows = [serialize_blog(post) for post in posts]
    if tag:
        rows = [row for row in rows if tag.lower() in {item.lower() for item in row["tags"]}]
    return rows


@router.get("/admin/list")
def admin_list_blogs(status: str | None = None, category: str | None = None, tag: str | None = None, q: str | None = None, skip: int = 0, limit: int = 100, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(BlogPost)
    if status:
        query = query.filter(BlogPost.status == status)
    if category:
        query = query.filter(BlogPost.category == category)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(BlogPost.title.ilike(term), BlogPost.excerpt.ilike(term), BlogPost.body.ilike(term), BlogPost.tags_json.ilike(term)))
    posts = ordered(query).offset(skip).limit(min(limit, 200)).all()
    rows = [serialize_blog(post) for post in posts]
    if tag:
        rows = [row for row in rows if tag.lower() in {item.lower() for item in row["tags"]}]
    return rows


@router.get("/admin/preview/{slug}")
def preview_blog(slug: str, admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    return serialize_blog(post)


@router.post("/admin/daily-draft")
def create_daily_draft(admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    slug = f"daily-fresh-atta-note-{today}"
    existing = db.query(BlogPost).filter_by(slug=slug).first()
    if existing:
        return {**serialize_blog(existing), "duplicate": True}
    topics = [
        ("How to Keep Fresh Atta Soft for Rotis", "Storage habits that help daily rotis stay soft and aromatic."),
        ("Why Fresh Milling Matters for Noida Homes", "A simple daily note on aroma, freshness and local delivery."),
        ("Choosing 1 KG, 5 KG or 10 KG Atta Packs", "How families can pick pack sizes by consumption pattern."),
    ]
    title, excerpt = topics[datetime.utcnow().timetuple().tm_yday % len(topics)]
    post = BlogPost(
        slug=slug,
        title=f"{title} - {today}",
        excerpt=excerpt,
        body=f"# {title}\n\nFresh atta works best when the path from grain to kitchen is short.\n\nUse this draft to add today's WheatRaja update, customer note, product photo, and SEO keywords before publishing.",
        category="Blog",
        read_time="3 min read",
        cover_image_url="/assets/banners/cover7.png",
        author_name="WheatRaja Team",
        tags_json=json.dumps(["fresh atta", "daily note"]),
        gallery_json="[]",
        inline_images_json="[]",
        featured=False,
        pinned_rank=100,
        status="draft",
        published=False,
        content_format="markdown",
        meta_keywords="fresh atta, WheatRaja, daily atta blog",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return serialize_blog(post)


@router.get("/{slug}")
def get_blog(slug: str, db: Session = Depends(get_db)):
    post = public_query(db).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    return serialize_blog(post)


@router.delete("/{slug}")
def delete_blog(slug: str, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(post)
    db.commit()
    return {"ok": True, "slug": slug}


@router.post("")
def create_blog(payload: BlogIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    if db.query(BlogPost).filter_by(slug=payload.slug).first():
        raise HTTPException(status_code=409, detail="Blog slug already exists")
    post = BlogPost()
    apply_payload(post, payload)
    db.add(post)
    db.commit()
    db.refresh(post)
    return serialize_blog(post)


@router.patch("/{slug}")
def update_blog(slug: str, payload: BlogIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    apply_payload(post, payload)
    db.commit()
    db.refresh(post)
    return serialize_blog(post)


@router.post("/{slug}/publish")
def publish_blog(slug: str, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    post.status = "published"
    post.published = True
    post.published_at = datetime.utcnow()
    post.scheduled_publish_at = None
    db.commit()
    db.refresh(post)
    return serialize_blog(post)


@router.post("/{slug}/schedule")
def schedule_blog(slug: str, payload: ScheduleIn, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    if payload.scheduled_publish_at <= datetime.utcnow() + timedelta(minutes=1):
        raise HTTPException(status_code=400, detail="Schedule must be at least one minute in the future")
    post.status = "scheduled"
    post.published = False
    post.published_at = None
    post.scheduled_publish_at = payload.scheduled_publish_at
    db.commit()
    db.refresh(post)
    return serialize_blog(post)


@router.post("/{slug}/archive")
def archive_blog(slug: str, admin: dict = Depends(require_admin_permission("cms.write")), db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter_by(slug=slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog not found")
    post.status = "archived"
    post.published = False
    db.commit()
    db.refresh(post)
    return serialize_blog(post)
