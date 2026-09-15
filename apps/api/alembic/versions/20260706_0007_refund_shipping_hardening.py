"""refund and shipping hardening

Revision ID: 20260706_0007
Revises: 20260706_0006
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260706_0007"
down_revision = "20260706_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "orders",
            "status",
            existing_type=sa.Enum("pending_payment", "placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            type_=sa.Enum("pending_payment", "placed", "milling", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            existing_nullable=False,
        )
    op.add_column("refunds", sa.Column("provider_refund_id", sa.String(length=160), nullable=True))
    op.add_column("refunds", sa.Column("payload_json", sa.Text(), nullable=True))
    op.create_index(op.f("ix_refunds_provider_refund_id"), "refunds", ["provider_refund_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_refunds_provider_refund_id"), table_name="refunds")
    op.drop_column("refunds", "payload_json")
    op.drop_column("refunds", "provider_refund_id")
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "orders",
            "status",
            existing_type=sa.Enum("pending_payment", "placed", "milling", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            type_=sa.Enum("pending_payment", "placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            existing_nullable=False,
        )
