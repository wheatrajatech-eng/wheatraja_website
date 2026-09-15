"""Market launch hardening schema.

Revision ID: 20260724_0011
Revises: 20260706_0010
Create Date: 2026-07-24
"""

from alembic import op
import sqlalchemy as sa


revision = "20260724_0011"
down_revision = "20260706_0010"
branch_labels = None
depends_on = None


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "products", "hsn_code"):
        op.add_column("products", sa.Column("hsn_code", sa.String(length=20), nullable=True))
        op.create_index("ix_products_hsn_code", "products", ["hsn_code"], unique=False)
    if not _has_column(inspector, "products", "gst_rate"):
        op.add_column("products", sa.Column("gst_rate", sa.Numeric(5, 2), nullable=True))
    op.execute("UPDATE products SET hsn_code = '11010000' WHERE active = 1 AND (hsn_code IS NULL OR hsn_code = '')")
    op.execute("UPDATE products SET gst_rate = 5.00 WHERE active = 1 AND gst_rate IS NULL")

    if not inspector.has_table("invoice_sequences"):
        op.create_table(
            "invoice_sequences",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("fiscal_year", sa.String(length=20), nullable=False),
            sa.Column("last_number", sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_invoice_sequences_uuid", "invoice_sequences", ["uuid"], unique=True)
        op.create_index("ix_invoice_sequences_deleted_at", "invoice_sequences", ["deleted_at"], unique=False)
        op.create_index("ix_invoice_sequences_fiscal_year", "invoice_sequences", ["fiscal_year"], unique=True)

    for table_name, index_name, columns in [
        ("payment_webhooks", "ix_payment_webhooks_created_at", ["created_at"]),
        ("payments", "ix_payments_status_created_at", ["status", "created_at"]),
        ("refunds", "ix_refunds_status_created_at", ["status", "created_at"]),
        ("admin_audit_logs", "ix_admin_audit_logs_action_created_at", ["action", "created_at"]),
        ("inventory_reservations", "ix_inventory_reservations_status_expires_at", ["status", "expires_at"]),
    ]:
        if inspector.has_table(table_name) and not _has_index(inspector, table_name, index_name):
            op.create_index(index_name, table_name, columns, unique=False)


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for table_name, index_name in [
        ("inventory_reservations", "ix_inventory_reservations_status_expires_at"),
        ("admin_audit_logs", "ix_admin_audit_logs_action_created_at"),
        ("refunds", "ix_refunds_status_created_at"),
        ("payments", "ix_payments_status_created_at"),
        ("payment_webhooks", "ix_payment_webhooks_created_at"),
    ]:
        if inspector.has_table(table_name) and _has_index(inspector, table_name, index_name):
            op.drop_index(index_name, table_name=table_name)
    if inspector.has_table("invoice_sequences"):
        op.drop_table("invoice_sequences")
    if _has_column(inspector, "products", "gst_rate"):
        op.drop_column("products", "gst_rate")
    if _has_column(inspector, "products", "hsn_code"):
        op.drop_index("ix_products_hsn_code", table_name="products")
        op.drop_column("products", "hsn_code")
