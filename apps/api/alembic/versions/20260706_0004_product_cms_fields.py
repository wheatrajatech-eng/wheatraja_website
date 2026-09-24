"""product cms fields

Revision ID: 20260706_0004
Revises: 20260701_0003
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260706_0004"
down_revision = "20260701_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {column["name"] for column in inspect(bind).get_columns("products")}
    columns = [
        sa.Column("headline", sa.String(length=220), nullable=True),
        sa.Column("benefit", sa.Text(), nullable=True),
        sa.Column("ingredients", sa.Text(), nullable=True),
        sa.Column("accent", sa.String(length=20), nullable=True),
        sa.Column("nutrition_json", sa.Text(), nullable=True),
        sa.Column("proof_json", sa.Text(), nullable=True),
        sa.Column("best_for_json", sa.Text(), nullable=True),
        sa.Column("comparison_json", sa.Text(), nullable=True),
        sa.Column("storage_json", sa.Text(), nullable=True),
        sa.Column("notes_json", sa.Text(), nullable=True),
        sa.Column("faqs_json", sa.Text(), nullable=True),
    ]
    for column in columns:
        if column.name not in existing:
            op.add_column("products", column)


def downgrade() -> None:
    op.drop_column("products", "faqs_json")
    op.drop_column("products", "notes_json")
    op.drop_column("products", "storage_json")
    op.drop_column("products", "comparison_json")
    op.drop_column("products", "best_for_json")
    op.drop_column("products", "proof_json")
    op.drop_column("products", "nutrition_json")
    op.drop_column("products", "accent")
    op.drop_column("products", "ingredients")
    op.drop_column("products", "benefit")
    op.drop_column("products", "headline")
