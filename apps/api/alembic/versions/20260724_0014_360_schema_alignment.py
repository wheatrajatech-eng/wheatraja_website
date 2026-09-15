"""Align 360 ecommerce schema with SQLAlchemy metadata.

Revision ID: 20260724_0014
Revises: 20260724_0013
Create Date: 2026-07-24
"""

from alembic import op
import sqlalchemy as sa


revision = "20260724_0014"
down_revision = "20260724_0013"
branch_labels = None
depends_on = None


TABLES = [
    "abandoned_cart_recoveries",
    "blog_product_links",
    "customer_segments",
    "delivery_slots",
    "loyalty_tiers",
    "product_recommendations",
    "support_tickets",
]


def _has_index(inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _has_table(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _alter_timestamp_nullability(table_name: str, nullable: bool) -> None:
    op.alter_column(table_name, "created_at", existing_type=sa.DateTime(), nullable=nullable)
    op.alter_column(table_name, "updated_at", existing_type=sa.DateTime(), nullable=nullable)


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for table_name in TABLES:
        if _has_table(inspector, table_name):
            _alter_timestamp_nullability(table_name, False)

    inspector = sa.inspect(op.get_bind())
    if _has_table(inspector, "abandoned_cart_recoveries"):
        if not _has_index(inspector, "abandoned_cart_recoveries", "ix_abandoned_cart_recoveries_converted_order_id"):
            op.create_index("ix_abandoned_cart_recoveries_converted_order_id", "abandoned_cart_recoveries", ["converted_order_id"])
        if not _has_index(inspector, "abandoned_cart_recoveries", "ix_abandoned_cart_recoveries_status"):
            op.create_index("ix_abandoned_cart_recoveries_status", "abandoned_cart_recoveries", ["status"])

    inspector = sa.inspect(op.get_bind())
    if _has_table(inspector, "loyalty_tiers"):
        if _has_index(inspector, "loyalty_tiers", "name"):
            op.drop_index("name", table_name="loyalty_tiers")
        if _has_index(inspector, "loyalty_tiers", "ix_loyalty_tiers_name"):
            op.drop_index("ix_loyalty_tiers_name", table_name="loyalty_tiers")
        op.create_index("ix_loyalty_tiers_name", "loyalty_tiers", ["name"], unique=True)

    inspector = sa.inspect(op.get_bind())
    if _has_table(inspector, "support_tickets"):
        if _has_index(inspector, "support_tickets", "ticket_number"):
            op.drop_index("ticket_number", table_name="support_tickets")
        if _has_index(inspector, "support_tickets", "ix_support_tickets_ticket_number"):
            op.drop_index("ix_support_tickets_ticket_number", table_name="support_tickets")
        op.create_index("ix_support_tickets_ticket_number", "support_tickets", ["ticket_number"], unique=True)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if _has_table(inspector, "support_tickets") and _has_index(inspector, "support_tickets", "ix_support_tickets_ticket_number"):
        op.drop_index("ix_support_tickets_ticket_number", table_name="support_tickets")
        op.create_index("ix_support_tickets_ticket_number", "support_tickets", ["ticket_number"], unique=False)
    if _has_table(inspector, "loyalty_tiers") and _has_index(inspector, "loyalty_tiers", "ix_loyalty_tiers_name"):
        op.drop_index("ix_loyalty_tiers_name", table_name="loyalty_tiers")
        op.create_index("ix_loyalty_tiers_name", "loyalty_tiers", ["name"], unique=False)
    if _has_table(inspector, "abandoned_cart_recoveries"):
        for index_name in ["ix_abandoned_cart_recoveries_status", "ix_abandoned_cart_recoveries_converted_order_id"]:
            if _has_index(inspector, "abandoned_cart_recoveries", index_name):
                op.drop_index(index_name, table_name="abandoned_cart_recoveries")
    for table_name in TABLES:
        if _has_table(inspector, table_name):
            _alter_timestamp_nullability(table_name, True)
