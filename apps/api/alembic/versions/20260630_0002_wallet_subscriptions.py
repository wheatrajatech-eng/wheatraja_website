"""wallet subscriptions ecommerce completion

Revision ID: 20260630_0002
Revises: 20260629_0001
Create Date: 2026-06-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260630_0002"
down_revision = "20260629_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # The initial schema migration uses metadata.create_all(), so some of
    # these columns may already exist on databases created from newer models.
    additions = {
        "orders": [
            sa.Column("wallet_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
            sa.Column("payable_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        ],
        "wallet_transactions": [
            sa.Column("amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
            sa.Column("transaction_type", sa.String(60), nullable=False, server_default="credit"),
        ],
        "subscriptions": [
            sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("next_delivery_at", sa.DateTime(), nullable=True),
            sa.Column("wallet_auto_deduct", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("status", sa.String(40), nullable=False, server_default="active"),
        ],
        "blog_posts": [
            sa.Column("category", sa.String(60), nullable=False, server_default="Blog"),
            sa.Column("read_time", sa.String(40), nullable=True),
            sa.Column("cover_image_url", sa.String(500), nullable=True),
        ],
    }
    for table_name, columns in additions.items():
        existing = {column["name"] for column in inspector.get_columns(table_name)}
        for column in columns:
            if column.name not in existing:
                op.add_column(table_name, column)


def downgrade() -> None:
    with op.batch_alter_table("blog_posts") as batch:
        batch.drop_column("cover_image_url")
        batch.drop_column("read_time")
        batch.drop_column("category")
    with op.batch_alter_table("subscriptions") as batch:
        batch.drop_column("status")
        batch.drop_column("wallet_auto_deduct")
        batch.drop_column("next_delivery_at")
        batch.drop_column("quantity")
    with op.batch_alter_table("wallet_transactions") as batch:
        batch.drop_column("transaction_type")
        batch.drop_column("amount")
    with op.batch_alter_table("orders") as batch:
        batch.drop_column("payable_amount")
        batch.drop_column("wallet_amount")
