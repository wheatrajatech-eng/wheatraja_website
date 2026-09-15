from datetime import datetime, timedelta
from pathlib import Path
import sys

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.api.blogs import admin_list_blogs, create_daily_draft, get_blog, list_blogs, preview_blog, serialize_blog
from app.core.database import Base
from app.models.entities import BlogPost


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


def add_post(db, slug: str, status: str, **kwargs):
    post = BlogPost(
        slug=slug,
        title=kwargs.get("title", slug.title()),
        excerpt=kwargs.get("excerpt", "Excerpt"),
        body=kwargs.get("body", "# Heading\n\nBody"),
        category=kwargs.get("category", "Blog"),
        read_time="3 min read",
        cover_image_url="/cover.png",
        published=status == "published",
        status=status,
        published_at=kwargs.get("published_at"),
        scheduled_publish_at=kwargs.get("scheduled_publish_at"),
        tags_json='["fresh atta","storage"]',
        gallery_json='["/gallery.png"]',
        inline_images_json='["/inline.png"]',
        featured=kwargs.get("featured", False),
        pinned_rank=kwargs.get("pinned_rank", 100),
        content_format="markdown",
        author_name="WheatRaja Team",
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def test_public_blog_visibility_and_admin_preview(db):
    now = datetime.utcnow()
    published = add_post(db, "published", "published", published_at=now)
    add_post(db, "draft", "draft")
    add_post(db, "future", "scheduled", scheduled_publish_at=now + timedelta(days=1))
    add_post(db, "past-scheduled", "scheduled", scheduled_publish_at=now - timedelta(minutes=5))

    rows = list_blogs(db=db)
    assert {row["slug"] for row in rows} == {"published", "past-scheduled"}
    assert get_blog("published", db)["slug"] == published.slug
    with pytest.raises(HTTPException):
        get_blog("draft", db)
    assert preview_blog("draft", {"sub": "9999999999", "role": "admin"}, db)["status"] == "draft"


def test_featured_pinned_order_and_tag_serialization(db):
    now = datetime.utcnow()
    add_post(db, "normal", "published", published_at=now, pinned_rank=100)
    add_post(db, "featured", "published", published_at=now - timedelta(days=1), featured=True, pinned_rank=1)

    rows = list_blogs(db=db)
    assert [row["slug"] for row in rows] == ["featured", "normal"]
    assert rows[0]["tags"] == ["fresh atta", "storage"]
    assert rows[0]["gallery"] == ["/gallery.png"]
    assert rows[0]["inline_images"] == ["/inline.png"]


def test_admin_filters_and_daily_draft(db):
    add_post(db, "storage-note", "draft", category="Article", title="Storage Note")
    assert admin_list_blogs(status="draft", category="Article", q="Storage", admin={"sub": "9999999999", "role": "admin"}, db=db)[0]["slug"] == "storage-note"

    draft = create_daily_draft({"sub": "9999999999", "role": "admin"}, db)
    assert draft["status"] == "draft"
    assert draft["published"] is False


def test_serialize_blog_returns_new_fields(db):
    post = add_post(db, "fields", "published", published_at=datetime.utcnow(), featured=True, pinned_rank=2)
    payload = serialize_blog(post)
    for key in ["author_name", "tags", "gallery", "inline_images", "featured", "pinned_rank", "status", "published_at", "content_format"]:
        assert key in payload
