"""commerce lifecycle tables

Revision ID: 20260706_0006
Revises: 20260706_0005
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260706_0006"
down_revision = "20260706_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = set(inspect(bind).get_table_names())
    lifecycle_tables = {
        "inventory_reservations",
        "shipment_events",
        "returns",
        "return_items",
        "notification_events",
    }
    # The initial metadata bootstrap may already have created these tables.
    # In that case this revision has no remaining schema work to perform.
    if lifecycle_tables.issubset(existing_tables):
        return
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "orders",
            "status",
            existing_type=sa.Enum("placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled"),
            type_=sa.Enum("pending_payment", "placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            existing_nullable=False,
        )
    op.create_table(
        "inventory_reservations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("variant_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("committed_at", sa.DateTime(), nullable=True),
        sa.Column("released_at", sa.DateTime(), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["product_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", "variant_id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_inventory_reservations_order_id"), "inventory_reservations", ["order_id"])
    op.create_index(op.f("ix_inventory_reservations_variant_id"), "inventory_reservations", ["variant_id"])
    op.create_index(op.f("ix_inventory_reservations_status"), "inventory_reservations", ["status"])
    op.create_index(op.f("ix_inventory_reservations_expires_at"), "inventory_reservations", ["expires_at"])
    op.create_index(op.f("ix_inventory_reservations_uuid"), "inventory_reservations", ["uuid"])
    op.create_index(op.f("ix_inventory_reservations_deleted_at"), "inventory_reservations", ["deleted_at"])

    op.create_table(
        "shipment_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shipment_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=80), nullable=False),
        sa.Column("location", sa.String(length=160), nullable=True),
        sa.Column("note", sa.String(length=300), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["shipment_id"], ["shipments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_shipment_events_shipment_id"), "shipment_events", ["shipment_id"])
    op.create_index(op.f("ix_shipment_events_status"), "shipment_events", ["status"])
    op.create_index(op.f("ix_shipment_events_uuid"), "shipment_events", ["uuid"])
    op.create_index(op.f("ix_shipment_events_deleted_at"), "shipment_events", ["deleted_at"])

    op.create_table(
        "returns",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=240), nullable=False),
        sa.Column("status", sa.String(length=60), nullable=False),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_returns_order_id"), "returns", ["order_id"])
    op.create_index(op.f("ix_returns_user_id"), "returns", ["user_id"])
    op.create_index(op.f("ix_returns_status"), "returns", ["status"])
    op.create_index(op.f("ix_returns_uuid"), "returns", ["uuid"])
    op.create_index(op.f("ix_returns_deleted_at"), "returns", ["deleted_at"])

    op.create_table(
        "return_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("return_id", sa.Integer(), nullable=False),
        sa.Column("order_item_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("condition", sa.String(length=120), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["return_id"], ["returns.id"]),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_return_items_return_id"), "return_items", ["return_id"])
    op.create_index(op.f("ix_return_items_uuid"), "return_items", ["uuid"])
    op.create_index(op.f("ix_return_items_deleted_at"), "return_items", ["deleted_at"])

    op.create_table(
        "notification_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_notification_events_user_id"), "notification_events", ["user_id"])
    op.create_index(op.f("ix_notification_events_event_type"), "notification_events", ["event_type"])
    op.create_index(op.f("ix_notification_events_status"), "notification_events", ["status"])
    op.create_index(op.f("ix_notification_events_uuid"), "notification_events", ["uuid"])
    op.create_index(op.f("ix_notification_events_deleted_at"), "notification_events", ["deleted_at"])


def downgrade() -> None:
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "orders",
            "status",
            existing_type=sa.Enum("pending_payment", "placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"),
            type_=sa.Enum("placed", "milling", "packed", "out_for_delivery", "delivered", "cancelled"),
            existing_nullable=False,
        )
    op.drop_table("notification_events")
    op.drop_table("return_items")
    op.drop_table("returns")
    op.drop_table("shipment_events")
    op.drop_table("inventory_reservations")
