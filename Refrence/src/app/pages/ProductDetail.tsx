import { useState } from "react";
import { ArrowLeft, Plus, Minus, RefreshCw, ShoppingCart, Check, BadgeCheck, Truck, Shield, Award } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS, REVIEWS } from "../data";
import { StarRow } from "../shared";

export function ProductDetail() {
  const { navigate, selectedProductId, addToCart, cart } = useApp();
  const product = PRODUCTS.find((p) => p.id === selectedProductId) ?? PRODUCTS[0];
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "nutrition" | "reviews">("description");
  const [activeImg, setActiveImg] = useState(0);
  const inCart = cart.find((i) => i.productId === product.id);

  const handleAddToCart = () => {
    addToCart(product.id, qty);
    navigate("cart");
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-6 pb-2">
        <button onClick={() => navigate("shop")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-8">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {/* Image gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-4">
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">{product.badge}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? "border-amber-500" : "border-border hover:border-amber-300"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div>
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-2">{product.category}</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-2">{product.name}</h1>
            <p className="text-muted-foreground text-base mb-4">{product.tagline}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <StarRow rating={product.rating} size="md" />
              <span className="font-bold text-stone-900">{product.rating}</span>
              <span className="text-muted-foreground text-sm">({product.reviewCount.toLocaleString("en-IN")} reviews)</span>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.benefits.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-medium">
                  <Check className="w-3.5 h-3.5" />{b}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-bold text-stone-900 text-3xl">₹{product.price}</span>
                <span className="text-stone-400 line-through text-lg">₹{Math.round(product.price * 1.12)}</span>
                <span className="text-green-700 font-bold text-sm bg-green-100 px-2 py-0.5 rounded-full">10% OFF</span>
              </div>
              <p className="text-sm text-green-700 font-medium">
                Subscribe price: <span className="font-bold">₹{product.subPrice}</span> / delivery — save ₹{product.price - product.subPrice} every order
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-stone-700">Quantity</span>
              <div className="flex items-center gap-3 bg-stone-100 rounded-full px-4 py-2.5">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-stone-500 hover:text-stone-900 transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="font-bold text-stone-900 min-w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-stone-500 hover:text-stone-900 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <span className="text-muted-foreground text-sm">{product.weight} per bag</span>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {inCart ? "View Cart" : "Add to Cart"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl transition-colors">
                <RefreshCw className="w-4 h-4" /> Subscribe
              </button>
            </div>

            {/* Trust signals */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BadgeCheck, label: "FSSAI Approved" },
                { icon: Award, label: "NABL Certified" },
                { icon: Truck, label: "Free Delivery (NCR)" },
                { icon: Shield, label: "100% Money Back" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-stone-50 border border-border rounded-xl p-3">
                  <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-medium text-stone-700">{label}</span>
                </div>
              ))}
            </div>

            {/* SKU */}
            <p className="text-xs text-muted-foreground mt-4">SKU: {product.sku}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex border-b border-border mb-8 gap-6">
            {(["description", "nutrition", "reviews"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${tab === t ? "border-amber-600 text-amber-700" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t === "reviews" ? `Reviews (${REVIEWS.length})` : t}
              </button>
            ))}
          </div>

          {tab === "description" && (
            <div className="max-w-2xl">
              <p className="text-stone-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {tab === "nutrition" && (
            <div className="max-w-md">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="bg-stone-900 text-white px-5 py-3">
                  <h3 className="font-serif font-bold">Nutritional Information</h3>
                  <p className="text-white/55 text-xs">Per 100g serving</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { label: "Energy", val: "340 kcal" },
                    { label: "Protein", val: product.protein },
                    { label: "Dietary Fiber", val: product.fiber },
                    { label: "Carbohydrates", val: "72g" },
                    { label: "Fat", val: "1.5g" },
                    { label: "Iron", val: "3.5mg" },
                    { label: "Calcium", val: "28mg" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between px-5 py-3 text-sm">
                      <span className="text-stone-600">{row.label}</span>
                      <span className="font-semibold text-stone-900">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
              {REVIEWS.map((r) => (
                <div key={r.name} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm shrink-0">{r.initials}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="font-semibold text-stone-900 text-sm">{r.name}</span><BadgeCheck className="w-3.5 h-3.5 text-green-600" /></div>
                      <div className="text-xs text-muted-foreground">{r.location} · {r.date}</div>
                    </div>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">{r.text}</p>
                  <p className="text-xs text-amber-700 font-medium mt-2">Purchased: {r.product}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
