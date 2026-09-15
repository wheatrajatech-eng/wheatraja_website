"""initial production schema

Revision ID: 20260629_0001
Revises:
Create Date: 2026-06-29
"""

from alembic import op
from app.core.database import Base
from app.models import entities  # noqa: F401

revision = "20260629_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
