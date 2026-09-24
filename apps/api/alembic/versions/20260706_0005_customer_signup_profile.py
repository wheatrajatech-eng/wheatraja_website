"""customer signup profile fields

Revision ID: 20260706_0005
Revises: 20260706_0004
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260706_0005"
down_revision = "20260706_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {column["name"] for column in inspect(bind).get_columns("users")}
    columns = [
        sa.Column("profile_complete", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("signup_completed_at", sa.DateTime(), nullable=True),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
    ]
    for column in columns:
        if column.name not in existing:
            op.add_column("users", column)
    op.execute("UPDATE users SET profile_complete = 1 WHERE name IS NOT NULL OR role = 'admin'")


def downgrade() -> None:
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "signup_completed_at")
    op.drop_column("users", "profile_complete")
