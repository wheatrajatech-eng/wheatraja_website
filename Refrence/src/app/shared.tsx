import { useApp } from "./context";
import { PRODUCTS } from "./data";

// ── StarRow ───────────────────────────────────────────────────────────────────
export function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className={`${dim} ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"}`}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </span>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    out_for_delivery: "bg-blue-100 text-blue-700",
    packed: "bg-amber-100 text-amber-700",
    processing: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-600",
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    inactive: "bg-stone-100 text-stone-500",
  };
  const label: Record<string, string> = {
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    packed: "Packed",
    processing: "Processing",
    cancelled: "Cancelled",
    active: "Active",
    paused: "Paused",
    inactive: "Inactive",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? "bg-stone-100 text-stone-600"}`}>
      {label[status] ?? status}
    </span>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────
export function ProductCard({ product, onNavigate }: { product: typeof PRODUCTS[0]; onNavigate: () => void }) {
  const { addToCart, cart, updateQty, addToWishlist, removeFromWishlist, isWishlisted } = useApp();
  const inCart = cart.find((i) => i.productId === product.id);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-border">
      <div className="relative aspect-square overflow-hidden bg-stone-100 cursor-pointer" onClick={onNavigate}>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

        {/* Wishlist heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            wishlisted ? removeFromWishlist(product.id) : addToWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center transition-all hover:scale-110 z-10"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "fill-none text-stone-400 stroke-current stroke-2"}`}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{product.badge}</span>
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/90 text-stone-700 text-[10px] font-semibold px-2 py-1 rounded-full shadow">{product.weight}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif font-bold text-stone-900 text-base mb-0.5 leading-snug cursor-pointer hover:text-amber-700 transition-colors" onClick={onNavigate}>
          {product.name}
        </h3>
        <p className="text-muted-foreground text-xs mb-3">{product.tagline}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {product.benefits.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-none stroke-current stroke-2"><polyline points="20,6 9,17 4,12" /></svg>
              {b}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <StarRow rating={product.rating} />
          <span className="text-[11px] text-muted-foreground">{product.rating} ({product.reviewCount.toLocaleString("en-IN")})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-bold text-stone-900 text-xl">₹{product.price}</span>
          <span className="text-xs text-stone-400 line-through">₹{Math.round(product.price * 1.12)}</span>
        </div>
        <div className="text-xs text-green-700 font-medium mb-4">
          Subscribe: ₹{product.subPrice}<span className="text-stone-400 font-normal ml-0.5">/ delivery</span>
        </div>

        {inCart ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-stone-100 rounded-full px-3 py-2">
              <button onClick={() => updateQty(product.id, inCart.qty - 1)} className="text-stone-500 hover:text-stone-900">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              <span className="font-bold text-stone-900 min-w-4 text-center text-sm">{inCart.qty}</span>
              <button onClick={() => addToCart(product.id)} className="text-stone-500 hover:text-stone-900">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>
            <button className="flex-1 bg-stone-900 text-white text-xs font-bold py-2.5 rounded-full transition-colors hover:bg-stone-800">
              Buy Now
            </button>
          </div>
        ) : (
          <button
            onClick={() => addToCart(product.id)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-full text-sm transition-all hover:shadow-md hover:shadow-amber-500/25 active:scale-95"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
