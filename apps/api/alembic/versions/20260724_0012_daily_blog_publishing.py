"""Daily blog publishing fields.

Revision ID: 20260724_0012
Revises: 20260724_0011
Create Date: 2026-07-24
"""

from alembic import op
import sqlalchemy as sa


revision = "20260724_0012"
down_revision = "20260724_0011"
branch_labels = None
depends_on = None


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    columns = [
        ("author_name", sa.String(length=120), True, None),
        ("tags_json", sa.Text(), True, None),
        ("gallery_json", sa.Text(), True, None),
        ("inline_images_json", sa.Text(), True, None),
        ("featured", sa.Boolean(), False, sa.text("0")),
        ("pinned_rank", sa.Integer(), False, sa.text("100")),
        ("status", sa.String(length=40), False, sa.text("'published'")),
        ("scheduled_publish_at", sa.DateTime(), True, None),
        ("published_at", sa.DateTime(), True, None),
        ("content_format", sa.String(length=40), False, sa.text("'markdown'")),
        ("meta_keywords", sa.String(length=300), True, None),
    ]
    for name, column_type, nullable, server_default in columns:
        if not _has_column(inspector, "blog_posts", name):
            op.add_column("blog_posts", sa.Column(name, column_type, nullable=nullable, server_default=server_default))

    op.execute("UPDATE blog_posts SET author_name = 'WheatRaja Team' WHERE author_name IS NULL")
    op.execute("UPDATE blog_posts SET tags_json = '[]' WHERE tags_json IS NULL")
    op.execute("UPDATE blog_posts SET gallery_json = '[]' WHERE gallery_json IS NULL")
    op.execute("UPDATE blog_posts SET inline_images_json = '[]' WHERE inline_images_json IS NULL")
    op.execute("UPDATE blog_posts SET featured = 0 WHERE featured IS NULL")
    op.execute("UPDATE blog_posts SET pinned_rank = 100 WHERE pinned_rank IS NULL")
    op.execute("UPDATE blog_posts SET status = CASE WHEN published = 1 THEN 'published' ELSE 'draft' END WHERE status IS NULL OR status = ''")
    op.execute("UPDATE blog_posts SET published_at = created_at WHERE status = 'published' AND published_at IS NULL")
    op.execute("UPDATE blog_posts SET content_format = 'markdown' WHERE content_format IS NULL OR content_format = ''")

    if not _has_index(inspector, "blog_posts", "ix_blog_posts_featured"):
        op.create_index("ix_blog_posts_featured", "blog_posts", ["featured"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_pinned_rank"):
        op.create_index("ix_blog_posts_pinned_rank", "blog_posts", ["pinned_rank"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_status"):
        op.create_index("ix_blog_posts_status", "blog_posts", ["status"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_scheduled_publish_at"):
        op.create_index("ix_blog_posts_scheduled_publish_at", "blog_posts", ["scheduled_publish_at"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_published_at"):
        op.create_index("ix_blog_posts_published_at", "blog_posts", ["published_at"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_status_published_at"):
        op.create_index("ix_blog_posts_status_published_at", "blog_posts", ["status", "published_at"], unique=False)
    if not _has_index(inspector, "blog_posts", "ix_blog_posts_featured_pinned"):
        op.create_index("ix_blog_posts_featured_pinned", "blog_posts", ["featured", "pinned_rank"], unique=False)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for index_name in [
        "ix_blog_posts_featured_pinned",
        "ix_blog_posts_status_published_at",
        "ix_blog_posts_published_at",
        "ix_blog_posts_scheduled_publish_at",
        "ix_blog_posts_status",
        "ix_blog_posts_pinned_rank",
        "ix_blog_posts_featured",
    ]:
        if _has_index(inspector, "blog_posts", index_name):
            op.drop_index(index_name, table_name="blog_posts")
    for name in [
        "meta_keywords",
        "content_format",
        "published_at",
        "scheduled_publish_at",
        "status",
        "pinned_rank",
        "featured",
        "inline_images_json",
        "gallery_json",
        "tags_json",
        "author_name",
    ]:
        if _has_column(inspector, "blog_posts", name):
            op.drop_column("blog_posts", name)
