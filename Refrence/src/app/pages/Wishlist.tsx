import { motion } from "motion/react";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS } from "../data";
import { StarRow } from "../shared";

export function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart, navigate } = useApp();
  const wishlisted = PRODUCTS.filter((p) => wishlist.includes(p.id));

  if (wishlisted.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground text-sm mb-7">Browse our products and add your favourites to come back to later.</p>
          <button
            onClick={() => navigate("shop")}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-5xl mx-auto px-5 md:px-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">My Wishlist</h1>
            <p className="text-muted-foreground text-sm mt-1">{wishlisted.length} item{wishlisted.length !== 1 ? "s" : ""} saved</p>
          </div>
          <button
            onClick={() => navigate("shop")}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:underline"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlisted.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-amber-300 transition-colors"
            >
              {/* Product image */}
              <div
                className="relative aspect-square overflow-hidden cursor-pointer bg-stone-50"
                onClick={() => navigate("product", { productId: product.id })}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {product.badge}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWishlist(product.id); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5">
                <button
                  className="text-left w-full"
                  onClick={() => navigate("product", { productId: product.id })}
                >
                  <p className="text-xs text-muted-foreground mb-1">{product.weight}</p>
                  <h3 className="font-serif font-bold text-stone-900 text-base mb-1 group-hover:text-amber-700 transition-colors">{product.name}</h3>
                  <p className="text-xs text-stone-500 mb-3 line-clamp-2">{product.tagline}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <StarRow rating={product.rating} />
                    <span className="text-xs text-muted-foreground">({product.reviewCount.toLocaleString()})</span>
                  </div>
                </button>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 text-lg">₹{product.price}</span>
                    <span className="text-xs text-muted-foreground ml-1">/ {product.weight}</span>
                  </div>
                  <button
                    onClick={() => { addToCart(product.id); }}
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-4 py-2.5 rounded-full transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add all to cart */}
        <div className="mt-8 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div>
            <p className="font-semibold text-stone-900 text-sm">{wishlisted.length} items in your wishlist</p>
            <p className="text-xs text-muted-foreground">Total value: ₹{wishlisted.reduce((s, p) => s + p.price, 0).toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={() => { wishlisted.forEach((p) => addToCart(p.id)); navigate("cart"); }}
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors"
          >
            <ShoppingCart className="w-4 h-4" /> Add All to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
