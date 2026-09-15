"""reminder delivery outbox

Revision ID: 20260826_0015
Revises: 20260724_0014
Create Date: 2026-08-26
"""

from alembic import op
import sqlalchemy as sa


revision = "20260826_0015"
down_revision = "20260724_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reminder_delivery_outbox",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reminder_schedule_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("channel", sa.String(length=40), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="queued"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("available_at", sa.DateTime(), nullable=False),
        sa.Column("last_attempt_at", sa.DateTime(), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("provider_message_id", sa.String(length=160), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["reminder_schedule_id"], ["reminder_schedules.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reminder_schedule_id", "channel"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_reminder_delivery_outbox_reminder_schedule_id"), "reminder_delivery_outbox", ["reminder_schedule_id"])
    op.create_index(op.f("ix_reminder_delivery_outbox_user_id"), "reminder_delivery_outbox", ["user_id"])
    op.create_index(op.f("ix_reminder_delivery_outbox_channel"), "reminder_delivery_outbox", ["channel"])
    op.create_index(op.f("ix_reminder_delivery_outbox_event_type"), "reminder_delivery_outbox", ["event_type"])
    op.create_index(op.f("ix_reminder_delivery_outbox_status"), "reminder_delivery_outbox", ["status"])
    op.create_index(op.f("ix_reminder_delivery_outbox_available_at"), "reminder_delivery_outbox", ["available_at"])
    op.create_index(op.f("ix_reminder_delivery_outbox_uuid"), "reminder_delivery_outbox", ["uuid"])
    op.create_index(op.f("ix_reminder_delivery_outbox_deleted_at"), "reminder_delivery_outbox", ["deleted_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_reminder_delivery_outbox_deleted_at"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_uuid"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_available_at"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_status"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_event_type"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_channel"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_user_id"), table_name="reminder_delivery_outbox")
    op.drop_index(op.f("ix_reminder_delivery_outbox_reminder_schedule_id"), table_name="reminder_delivery_outbox")
    op.drop_table("reminder_delivery_outbox")
