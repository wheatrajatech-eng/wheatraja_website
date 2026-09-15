"""business operations fields

Revision ID: 20260706_0009
Revises: 20260706_0008
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260706_0009"
down_revision = "20260706_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("blocked", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("admin_notes", sa.Text(), nullable=True))
    op.add_column("addresses", sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.add_column("products", sa.Column("category_id", sa.Integer(), nullable=True))
    op.add_column("products", sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("products", sa.Column("seo_title", sa.String(length=180), nullable=True))
    op.add_column("products", sa.Column("seo_description", sa.String(length=320), nullable=True))
    op.create_foreign_key("fk_products_category_id_categories", "products", "categories", ["category_id"], ["id"])

    op.add_column("product_variants", sa.Column("sku", sa.String(length=120), nullable=True))
    op.add_column("product_variants", sa.Column("mrp", sa.Numeric(10, 2), nullable=True))
    op.add_column("product_variants", sa.Column("discount_percent", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("product_variants", sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="10"))
    op.create_index(op.f("ix_product_variants_sku"), "product_variants", ["sku"], unique=True)

    op.add_column("banners", sa.Column("subtitle", sa.String(length=260), nullable=True))
    op.add_column("banners", sa.Column("cta_text", sa.String(length=80), nullable=True))
    op.add_column("banners", sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("banners", sa.Column("starts_at", sa.DateTime(), nullable=True))
    op.add_column("banners", sa.Column("ends_at", sa.DateTime(), nullable=True))

    op.add_column("blog_posts", sa.Column("seo_title", sa.String(length=180), nullable=True))
    op.add_column("blog_posts", sa.Column("seo_description", sa.String(length=320), nullable=True))

    op.add_column("orders", sa.Column("billing_address_text", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("source_channel", sa.String(length=60), nullable=False, server_default="website"))
    op.add_column("orders", sa.Column("source_detail", sa.String(length=240), nullable=True))
    op.add_column("orders", sa.Column("campaign_name", sa.String(length=160), nullable=True))
    op.add_column("orders", sa.Column("utm_source", sa.String(length=120), nullable=True))
    op.add_column("orders", sa.Column("utm_medium", sa.String(length=120), nullable=True))
    op.add_column("orders", sa.Column("utm_campaign", sa.String(length=160), nullable=True))
    op.add_column("orders", sa.Column("created_by", sa.String(length=60), nullable=False, server_default="customer"))
    op.add_column("orders", sa.Column("admin_owner_id", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("admin_notes", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("customer_notes", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("expected_delivery_at", sa.DateTime(), nullable=True))
    op.add_column("orders", sa.Column("payment_method", sa.String(length=60), nullable=True))
    op.create_foreign_key("fk_orders_admin_owner_id_users", "orders", "users", ["admin_owner_id"], ["id"])
    op.create_index(op.f("ix_orders_source_channel"), "orders", ["source_channel"])

    op.add_column("payments", sa.Column("method", sa.String(length=60), nullable=True))
    op.add_column("payments", sa.Column("transaction_reference", sa.String(length=160), nullable=True))
    op.add_column("payments", sa.Column("note", sa.Text(), nullable=True))
    op.add_column("payments", sa.Column("proof_url", sa.String(length=500), nullable=True))
    op.add_column("payments", sa.Column("received_at", sa.DateTime(), nullable=True))
    op.create_index(op.f("ix_payments_transaction_reference"), "payments", ["transaction_reference"])


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_transaction_reference"), table_name="payments")
    for column in ["received_at", "proof_url", "note", "transaction_reference", "method"]:
        op.drop_column("payments", column)
    op.drop_index(op.f("ix_orders_source_channel"), table_name="orders")
    op.drop_constraint("fk_orders_admin_owner_id_users", "orders", type_="foreignkey")
    for column in ["payment_method", "expected_delivery_at", "customer_notes", "admin_notes", "admin_owner_id", "created_by", "utm_campaign", "utm_medium", "utm_source", "campaign_name", "source_detail", "source_channel", "billing_address_text"]:
        op.drop_column("orders", column)
    op.drop_column("blog_posts", "seo_description")
    op.drop_column("blog_posts", "seo_title")
    for column in ["ends_at", "starts_at", "display_order", "cta_text", "subtitle"]:
        op.drop_column("banners", column)
    op.drop_index(op.f("ix_product_variants_sku"), table_name="product_variants")
    for column in ["low_stock_threshold", "discount_percent", "mrp", "sku"]:
        op.drop_column("product_variants", column)
    op.drop_constraint("fk_products_category_id_categories", "products", type_="foreignkey")
    for column in ["seo_description", "seo_title", "featured", "category_id"]:
        op.drop_column("products", column)
    op.drop_column("addresses", "is_default")
    op.drop_column("users", "admin_notes")
    op.drop_column("users", "blocked")
