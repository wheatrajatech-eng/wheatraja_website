"""Launch completion schema.

Revision ID: 20260706_0010
Revises: 20260706_0009
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260706_0010"
down_revision = "20260706_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("email_attempt_logs"):
        op.create_table(
            "email_attempt_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("provider", sa.String(length=60), nullable=False),
            sa.Column("recipient", sa.String(length=180), nullable=False),
            sa.Column("subject", sa.String(length=240), nullable=False),
            sa.Column("event_type", sa.String(length=120), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False),
            sa.Column("error", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index("ix_email_attempt_logs_uuid", "email_attempt_logs", ["uuid"], unique=False)
        op.create_index("ix_email_attempt_logs_deleted_at", "email_attempt_logs", ["deleted_at"], unique=False)
        op.create_index("ix_email_attempt_logs_provider", "email_attempt_logs", ["provider"], unique=False)
        op.create_index("ix_email_attempt_logs_recipient", "email_attempt_logs", ["recipient"], unique=False)
        op.create_index("ix_email_attempt_logs_event_type", "email_attempt_logs", ["event_type"], unique=False)
        op.create_index("ix_email_attempt_logs_status", "email_attempt_logs", ["status"], unique=False)
        op.create_index("ix_email_attempt_logs_status_created_at", "email_attempt_logs", ["status", "created_at"], unique=False)

    if not inspector.has_table("invoices"):
        op.create_table(
            "invoices",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("order_id", sa.Integer(), nullable=False),
            sa.Column("invoice_number", sa.String(length=60), nullable=False),
            sa.Column("invoice_date", sa.DateTime(), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False),
            sa.Column("seller_json", sa.Text(), nullable=True),
            sa.Column("tax_json", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("order_id"),
            sa.UniqueConstraint("invoice_number"),
            sa.UniqueConstraint("uuid"),
        )
        op.create_index("ix_invoices_uuid", "invoices", ["uuid"], unique=False)
        op.create_index("ix_invoices_deleted_at", "invoices", ["deleted_at"], unique=False)
        op.create_index("ix_invoices_order_id", "invoices", ["order_id"], unique=False)
        op.create_index("ix_invoices_invoice_number", "invoices", ["invoice_number"], unique=False)
        op.create_index("ix_invoices_status", "invoices", ["status"], unique=False)


def downgrade() -> None:
    op.drop_table("invoices")
    op.drop_table("email_attempt_logs")
