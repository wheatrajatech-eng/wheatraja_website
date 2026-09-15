"""360 ecommerce foundations.

Revision ID: 20260724_0013
Revises: 20260724_0012
Create Date: 2026-07-24
"""

from alembic import op
import sqlalchemy as sa


revision = "20260724_0013"
down_revision = "20260724_0012"
branch_labels = None
depends_on = None


def _has_table(inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not _has_table(inspector, "abandoned_cart_recoveries"):
        op.create_table(
            "abandoned_cart_recoveries",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("phone", sa.String(length=20), nullable=True),
            sa.Column("email", sa.String(length=180), nullable=True),
            sa.Column("session_id", sa.String(length=120), nullable=True),
            sa.Column("cart_json", sa.Text(), nullable=False),
            sa.Column("subtotal", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
            sa.Column("status", sa.String(length=40), nullable=False, server_default=sa.text("'open'")),
            sa.Column("recovery_channel", sa.String(length=40), nullable=True),
            sa.Column("last_reminder_at", sa.DateTime(), nullable=True),
            sa.Column("checkout_started_at", sa.DateTime(), nullable=True),
            sa.Column("converted_order_id", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["converted_order_id"], ["orders.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_abandoned_cart_recoveries_uuid", "abandoned_cart_recoveries", ["uuid"], unique=True)
        op.create_index("ix_abandoned_cart_recoveries_deleted_at", "abandoned_cart_recoveries", ["deleted_at"])
        op.create_index("ix_abandoned_cart_recoveries_user_id", "abandoned_cart_recoveries", ["user_id"])
        op.create_index("ix_abandoned_cart_recoveries_phone", "abandoned_cart_recoveries", ["phone"])
        op.create_index("ix_abandoned_cart_recoveries_email", "abandoned_cart_recoveries", ["email"])
        op.create_index("ix_abandoned_cart_recoveries_session_id", "abandoned_cart_recoveries", ["session_id"])
        op.create_index("ix_abandoned_cart_recoveries_status_updated_at", "abandoned_cart_recoveries", ["status", "updated_at"])
        op.create_index("ix_abandoned_cart_recoveries_user_status", "abandoned_cart_recoveries", ["user_id", "status"])

    if not _has_table(inspector, "loyalty_tiers"):
        op.create_table(
            "loyalty_tiers",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("name", sa.String(length=80), nullable=False),
            sa.Column("min_points", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("reward_multiplier", sa.Numeric(5, 2), nullable=False, server_default=sa.text("1")),
            sa.Column("perks_json", sa.Text(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("name"),
        )
        op.create_index("ix_loyalty_tiers_uuid", "loyalty_tiers", ["uuid"], unique=True)
        op.create_index("ix_loyalty_tiers_deleted_at", "loyalty_tiers", ["deleted_at"])
        op.create_index("ix_loyalty_tiers_name", "loyalty_tiers", ["name"])
        op.create_index("ix_loyalty_tiers_min_points", "loyalty_tiers", ["min_points"])
        op.create_index("ix_loyalty_tiers_active", "loyalty_tiers", ["active"])

    if not _has_table(inspector, "customer_segments"):
        op.create_table(
            "customer_segments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("segment", sa.String(length=80), nullable=False),
            sa.Column("reason_json", sa.Text(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("user_id", "segment"),
        )
        op.create_index("ix_customer_segments_uuid", "customer_segments", ["uuid"], unique=True)
        op.create_index("ix_customer_segments_deleted_at", "customer_segments", ["deleted_at"])
        op.create_index("ix_customer_segments_user_id", "customer_segments", ["user_id"])
        op.create_index("ix_customer_segments_segment", "customer_segments", ["segment"])
        op.create_index("ix_customer_segments_active", "customer_segments", ["active"])

    if not _has_table(inspector, "support_tickets"):
        op.create_table(
            "support_tickets",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("ticket_number", sa.String(length=40), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("order_id", sa.Integer(), nullable=True),
            sa.Column("category", sa.String(length=60), nullable=False, server_default=sa.text("'general'")),
            sa.Column("subject", sa.String(length=180), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("status", sa.String(length=40), nullable=False, server_default=sa.text("'open'")),
            sa.Column("priority", sa.String(length=40), nullable=False, server_default=sa.text("'normal'")),
            sa.Column("resolution_note", sa.Text(), nullable=True),
            sa.Column("assigned_admin_id", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["assigned_admin_id"], ["users.id"]),
            sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("ticket_number"),
        )
        op.create_index("ix_support_tickets_uuid", "support_tickets", ["uuid"], unique=True)
        op.create_index("ix_support_tickets_deleted_at", "support_tickets", ["deleted_at"])
        op.create_index("ix_support_tickets_ticket_number", "support_tickets", ["ticket_number"])
        op.create_index("ix_support_tickets_user_id", "support_tickets", ["user_id"])
        op.create_index("ix_support_tickets_order_id", "support_tickets", ["order_id"])
        op.create_index("ix_support_tickets_category", "support_tickets", ["category"])
        op.create_index("ix_support_tickets_status", "support_tickets", ["status"])
        op.create_index("ix_support_tickets_status_created_at", "support_tickets", ["status", "created_at"])
        op.create_index("ix_support_tickets_user_status", "support_tickets", ["user_id", "status"])

    if not _has_table(inspector, "delivery_slots"):
        op.create_table(
            "delivery_slots",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("zone", sa.String(length=120), nullable=False, server_default=sa.text("'Noida Core'")),
            sa.Column("pincode", sa.String(length=12), nullable=True),
            sa.Column("starts_at", sa.DateTime(), nullable=False),
            sa.Column("ends_at", sa.DateTime(), nullable=False),
            sa.Column("capacity", sa.Integer(), nullable=False, server_default=sa.text("25")),
            sa.Column("booked_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_delivery_slots_uuid", "delivery_slots", ["uuid"], unique=True)
        op.create_index("ix_delivery_slots_deleted_at", "delivery_slots", ["deleted_at"])
        op.create_index("ix_delivery_slots_zone", "delivery_slots", ["zone"])
        op.create_index("ix_delivery_slots_pincode", "delivery_slots", ["pincode"])
        op.create_index("ix_delivery_slots_starts_at", "delivery_slots", ["starts_at"])
        op.create_index("ix_delivery_slots_active", "delivery_slots", ["active"])
        op.create_index("ix_delivery_slots_zone_start", "delivery_slots", ["zone", "starts_at"])

    if not _has_table(inspector, "product_recommendations"):
        op.create_table(
            "product_recommendations",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("source_product_id", sa.Integer(), nullable=True),
            sa.Column("target_product_id", sa.Integer(), nullable=False),
            sa.Column("placement", sa.String(length=80), nullable=False, server_default=sa.text("'similar'")),
            sa.Column("rank", sa.Integer(), nullable=False, server_default=sa.text("100")),
            sa.Column("reason", sa.String(length=240), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.ForeignKeyConstraint(["source_product_id"], ["products.id"]),
            sa.ForeignKeyConstraint(["target_product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("source_product_id", "target_product_id", "placement"),
        )
        op.create_index("ix_product_recommendations_uuid", "product_recommendations", ["uuid"], unique=True)
        op.create_index("ix_product_recommendations_deleted_at", "product_recommendations", ["deleted_at"])
        op.create_index("ix_product_recommendations_source_product_id", "product_recommendations", ["source_product_id"])
        op.create_index("ix_product_recommendations_target_product_id", "product_recommendations", ["target_product_id"])
        op.create_index("ix_product_recommendations_placement", "product_recommendations", ["placement"])
        op.create_index("ix_product_recommendations_active", "product_recommendations", ["active"])
        op.create_index("ix_product_recommendations_source_placement", "product_recommendations", ["source_product_id", "placement"])

    if not _has_table(inspector, "blog_product_links"):
        op.create_table(
            "blog_product_links",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("uuid", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("deleted_at", sa.DateTime(), nullable=True),
            sa.Column("blog_post_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("rank", sa.Integer(), nullable=False, server_default=sa.text("100")),
            sa.Column("cta_text", sa.String(length=80), nullable=True),
            sa.ForeignKeyConstraint(["blog_post_id"], ["blog_posts.id"]),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("blog_post_id", "product_id"),
        )
        op.create_index("ix_blog_product_links_uuid", "blog_product_links", ["uuid"], unique=True)
        op.create_index("ix_blog_product_links_deleted_at", "blog_product_links", ["deleted_at"])
        op.create_index("ix_blog_product_links_blog_post_id", "blog_product_links", ["blog_post_id"])
        op.create_index("ix_blog_product_links_product_id", "blog_product_links", ["product_id"])


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for table_name in [
        "blog_product_links",
        "product_recommendations",
        "delivery_slots",
        "support_tickets",
        "customer_segments",
        "loyalty_tiers",
        "abandoned_cart_recoveries",
    ]:
        if _has_table(inspector, table_name):
            op.drop_table(table_name)
