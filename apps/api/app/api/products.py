from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import json
from app.core.database import get_db
from app.core.auth_deps import require_admin_permission
from app.models.entities import Category, Inventory, Product, ProductImage, ProductVariant
from app.services.store import serialize_product

router = APIRouter(prefix="/products", tags=["products"])


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    headline: str | None = None
    benefit: str | None = None
    ingredients: str | None = None
    accent: str | None = None
    nutrition: list[dict] | None = None
    proof: list[str] | None = None
    best_for: list[str] | None = None
    comparison: list[dict] | None = None
    storage: list[str] | None = None
    notes: list[str] | None = None
    faqs: list[dict] | None = None
    active: bool | None = None
    featured: bool | None = None
    category_id: int | None = None
    category_slug: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    hsn_code: str | None = Field(default=None, max_length=20)
    gst_rate: float | None = Field(default=None, ge=0, le=28)


class ProductCreate(BaseModel):
    slug: str
    name: str
    description: str
    headline: str | None = None
    benefit: str | None = None
    ingredients: str | None = None
    accent: str | None = None
    nutrition: list[dict] = Field(default_factory=list)
    proof: list[str] = Field(default_factory=list)
    best_for: list[str] = Field(default_factory=list)
    comparison: list[dict] = Field(default_factory=list)
    storage: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    faqs: list[dict] = Field(default_factory=list)
    active: bool = True
    featured: bool = False
    category_id: int | None = None
    category_slug: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    hsn_code: str | None = Field(default=None, max_length=20)
    gst_rate: float | None = Field(default=None, ge=0, le=28)
    variants: list[dict] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)


class VariantIn(BaseModel):
    weight_kg: int
    sku: str | None = None
    mrp: float | None = None
    price: float
    discount_percent: int = 0
    low_stock_threshold: int = 10
    inventory: int = 0


class ProductImageIn(BaseModel):
    url: str
    alt: str | None = None


def resolve_category_id(db: Session, category_id: int | None, category_slug: str | None) -> int | None:
    if category_id:
        return category_id
    if category_slug:
        category = db.query(Category).filter_by(slug=category_slug).first()
        return category.id if category else None
    return None


@router.get("")
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).filter_by(active=True).order_by(Product.name.asc()).offset(skip).limit(min(limit, 200)).all()
    return [serialize_product(product) for product in products]


@router.post("")
def create_product(payload: ProductCreate, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    if db.query(Product).filter_by(slug=payload.slug).first():
        raise HTTPException(status_code=409, detail="Product slug already exists")
    product = Product(
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        headline=payload.headline,
        benefit=payload.benefit,
        ingredients=payload.ingredients,
        accent=payload.accent,
        nutrition_json=json.dumps(payload.nutrition),
        proof_json=json.dumps(payload.proof),
        best_for_json=json.dumps(payload.best_for),
        comparison_json=json.dumps(payload.comparison),
        storage_json=json.dumps(payload.storage),
        notes_json=json.dumps(payload.notes),
        faqs_json=json.dumps(payload.faqs),
        active=payload.active,
        hsn_code=payload.hsn_code,
        gst_rate=payload.gst_rate,
    )
    product.featured = payload.featured
    product.category_id = resolve_category_id(db, payload.category_id, payload.category_slug)
    product.seo_title = payload.seo_title
    product.seo_description = payload.seo_description
    db.add(product)
    db.flush()
    for raw in payload.variants:
        variant = VariantIn(**raw)
        created = ProductVariant(product_id=product.id, weight_kg=variant.weight_kg, sku=variant.sku, mrp=variant.mrp, price=variant.price, discount_percent=variant.discount_percent, low_stock_threshold=variant.low_stock_threshold, inventory=variant.inventory)
        db.add(created)
        db.flush()
        db.add(Inventory(variant_id=created.id, available=variant.inventory, reserved=0))
    for url in payload.images:
        db.add(ProductImage(product_id=product.id, url=url, alt=f"{payload.name} WheatRaja pack"))
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.get("/{slug}")
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter_by(slug=slug, active=True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


@router.patch("/{slug}")
def update_product(slug: str, payload: ProductUpdate, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    product = db.query(Product).filter_by(slug=slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.name is not None:
        product.name = payload.name
    if payload.description is not None:
        product.description = payload.description
    if payload.headline is not None:
        product.headline = payload.headline
    if payload.benefit is not None:
        product.benefit = payload.benefit
    if payload.ingredients is not None:
        product.ingredients = payload.ingredients
    if payload.accent is not None:
        product.accent = payload.accent
    for attr, column in [
        ("nutrition", "nutrition_json"),
        ("proof", "proof_json"),
        ("best_for", "best_for_json"),
        ("comparison", "comparison_json"),
        ("storage", "storage_json"),
        ("notes", "notes_json"),
        ("faqs", "faqs_json"),
    ]:
        value = getattr(payload, attr)
        if value is not None:
            setattr(product, column, json.dumps(value))
    if payload.active is not None:
        product.active = payload.active
    if payload.featured is not None:
        product.featured = payload.featured
    if payload.category_id is not None or payload.category_slug is not None:
        product.category_id = resolve_category_id(db, payload.category_id, payload.category_slug)
    if payload.seo_title is not None:
        product.seo_title = payload.seo_title
    if payload.seo_description is not None:
        product.seo_description = payload.seo_description
    if payload.hsn_code is not None:
        product.hsn_code = payload.hsn_code
    if payload.gst_rate is not None:
        product.gst_rate = payload.gst_rate
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.delete("/{slug}")
def delete_product(slug: str, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    product = db.query(Product).filter_by(slug=slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.active = False
    db.commit()
    return {"ok": True, "slug": slug}


@router.patch("/{slug}/variants/{weight_kg}")
def update_variant(slug: str, weight_kg: int, price: float | None = None, inventory: int | None = None, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    variant = db.query(ProductVariant).join(Product).filter(Product.slug == slug, ProductVariant.weight_kg == weight_kg).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    if price is not None:
        variant.price = price
    if inventory is not None:
        variant.inventory = inventory
    db.commit()
    db.refresh(variant)
    return {"id": variant.id, "weight_kg": variant.weight_kg, "sku": variant.sku, "mrp": float(variant.mrp) if variant.mrp is not None else None, "price": float(variant.price), "discount_percent": variant.discount_percent, "low_stock_threshold": variant.low_stock_threshold, "inventory": variant.inventory}


@router.post("/{slug}/variants")
def upsert_variant(slug: str, payload: VariantIn, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    product = db.query(Product).filter_by(slug=slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    variant = db.query(ProductVariant).filter_by(product_id=product.id, weight_kg=payload.weight_kg).first()
    if not variant:
        variant = ProductVariant(product_id=product.id, weight_kg=payload.weight_kg, price=payload.price)
        db.add(variant)
        db.flush()
    variant.price = payload.price
    variant.sku = payload.sku
    variant.mrp = payload.mrp
    variant.discount_percent = payload.discount_percent
    variant.low_stock_threshold = payload.low_stock_threshold
    variant.inventory = payload.inventory
    inventory = db.query(Inventory).filter_by(variant_id=variant.id).first()
    if not inventory:
        inventory = Inventory(variant_id=variant.id)
        db.add(inventory)
    inventory.available = payload.inventory
    db.commit()
    return serialize_product(product)


@router.delete("/{slug}/images/{image_id}")
def delete_image(slug: str, image_id: int, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    product = db.query(Product).filter_by(slug=slug).first()
    image = db.query(ProductImage).filter_by(id=image_id, product_id=product.id if product else None).first()
    if not product or not image:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.post("/{slug}/images")
def add_image(slug: str, payload: ProductImageIn, db: Session = Depends(get_db), admin: dict = Depends(require_admin_permission("products.write"))):
    product = db.query(Product).filter_by(slug=slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    image = ProductImage(product_id=product.id, url=payload.url, alt=payload.alt or f"{product.name} image")
    db.add(image)
    db.commit()
    db.refresh(product)
    return serialize_product(product)
