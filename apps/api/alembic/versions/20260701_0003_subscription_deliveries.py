"""subscription delivery calendar

Revision ID: 20260701_0003
Revises: 20260630_0002
Create Date: 2026-07-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260701_0003"
down_revision = "20260630_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "subscription_deliveries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("subscription_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="scheduled"),
        sa.Column("wallet_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("payable_amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("note", sa.String(length=240), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subscription_id", "scheduled_for"),
    )
    op.create_index(op.f("ix_subscription_deliveries_uuid"), "subscription_deliveries", ["uuid"], unique=True)
    op.create_index(op.f("ix_subscription_deliveries_deleted_at"), "subscription_deliveries", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_subscription_deliveries_deleted_at"), table_name="subscription_deliveries")
    op.drop_index(op.f("ix_subscription_deliveries_uuid"), table_name="subscription_deliveries")
    op.drop_table("subscription_deliveries")
