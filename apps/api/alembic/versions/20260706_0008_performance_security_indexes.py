"""performance and reconciliation indexes

Revision ID: 20260706_0008
Revises: 20260706_0007
Create Date: 2026-07-06
"""

from alembic import op


revision = "20260706_0008"
down_revision = "20260706_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_orders_status_created_at", "orders", ["status", "created_at"])
    op.create_index("ix_orders_payment_status_created_at", "orders", ["payment_status", "created_at"])
    op.create_index("ix_payments_provider_order_id", "payments", ["provider_order_id"])
    op.create_index("ix_payments_provider_payment_id", "payments", ["provider_payment_id"])
    op.create_index("ix_shipments_status_created_at", "shipments", ["status", "created_at"])
    op.create_index("ix_returns_status_created_at", "returns", ["status", "created_at"])
    op.create_index("ix_notification_events_status_created_at", "notification_events", ["status", "created_at"])
    op.create_index("ix_stock_movements_variant_created_at", "stock_movements", ["variant_id", "created_at"])
    op.create_index("ix_admin_audit_logs_admin_created_at", "admin_audit_logs", ["admin_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_admin_created_at", table_name="admin_audit_logs")
    op.drop_index("ix_stock_movements_variant_created_at", table_name="stock_movements")
    op.drop_index("ix_notification_events_status_created_at", table_name="notification_events")
    op.drop_index("ix_returns_status_created_at", table_name="returns")
    op.drop_index("ix_shipments_status_created_at", table_name="shipments")
    op.drop_index("ix_payments_provider_payment_id", table_name="payments")
    op.drop_index("ix_payments_provider_order_id", table_name="payments")
    op.drop_index("ix_orders_payment_status_created_at", table_name="orders")
    op.drop_index("ix_orders_status_created_at", table_name="orders")
