from app.core.database import Base, SessionLocal, engine
from app.models.entities import Coupon, DeliveryRule, Product, ProductVariant, Setting
from app.seed.data import PRODUCTS, SEED_COUPONS


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
      for item in PRODUCTS:
          product = db.query(Product).filter_by(slug=item["slug"]).first()
          if not product:
              product = Product(slug=item["slug"], name=item["name"], description=f"{item['name']} freshly milled after order.")
              db.add(product)
              db.flush()
          for variant in item["variants"]:
              exists = db.query(ProductVariant).filter_by(product_id=product.id, weight_kg=variant["weight_kg"]).first()
              if not exists:
                  db.add(ProductVariant(product_id=product.id, weight_kg=variant["weight_kg"], price=variant["price"], inventory=200))

      for coupon in SEED_COUPONS:
          if not db.query(Coupon).filter_by(code=coupon["code"]).first():
              db.add(Coupon(**coupon))

      if not db.query(DeliveryRule).first():
          db.add_all([
              DeliveryRule(min_km=0, max_km=20, charge=0, deliverable=True),
              DeliveryRule(min_km=20, max_km=30, charge=40, deliverable=True),
              DeliveryRule(min_km=30, max_km=40, charge=70, deliverable=True),
              DeliveryRule(min_km=40, max_km=60, charge=100, deliverable=True),
              DeliveryRule(min_km=60, max_km=None, charge=None, deliverable=False, admin_override_allowed=True)
          ])

      if not db.query(Setting).filter_by(key="wallet_active").first():
          db.add(Setting(key="wallet_active", value="true"))
      db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
