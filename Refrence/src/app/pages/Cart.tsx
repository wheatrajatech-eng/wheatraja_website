import { useState } from "react";
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, RefreshCw } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS } from "../data";

const PRICES = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price]));

const COUPONS: Record<string, { type: "pct" | "flat"; val: number; label: string }> = {
  FIRST20: { type: "pct", val: 20, label: "20% off (First Order)" },
  SAVE05: { type: "pct", val: 5, label: "5% off" },
  FLAT50: { type: "flat", val: 50, label: "₹50 flat off" },
};

export function Cart() {
  const { cart, navigate, updateQty, removeFromCart, cartTotal, clearCart } = useApp();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<typeof COUPONS[string] | null>(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = cartTotal(PRICES);
  const discount = applied
    ? applied.type === "pct"
      ? Math.round((subtotal * applied.val) / 100)
      : applied.val
    : 0;
  const delivery = subtotal >= 499 ? 0 : 29;
  const total = subtotal - discount + delivery;

  const applyCoupon = () => {
    const c = COUPONS[coupon.toUpperCase()];
    if (c) { setApplied(c); setCouponError(""); }
    else { setApplied(null); setCouponError("Invalid coupon code. Try FIRST20, SAVE05 or FLAT50."); }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="text-center py-20 px-5">
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="font-serif font-bold text-stone-900 text-2xl mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some fresh atta to get started.</p>
          <button onClick={() => navigate("shop")} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-full transition-colors">
            <ShoppingBag className="w-4 h-4" /> Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-10">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Your Cart</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => {
              const product = PRODUCTS.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <div key={item.productId} className="bg-card border border-border rounded-2xl p-5 flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-stone-900 text-sm">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.weight}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5">
                        <button onClick={() => updateQty(item.productId, item.qty - 1)} className="text-stone-500 hover:text-stone-900"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="font-bold text-stone-900 min-w-5 text-center text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)} className="text-stone-500 hover:text-stone-900"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <span className="font-bold text-stone-900">₹{product.price * item.qty}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Subscribe suggestion */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm">Convert to subscription &amp; save 10%</p>
                <p className="text-amber-700 text-xs">Get fresh atta delivered automatically. Cancel anytime.</p>
              </div>
              <button className="shrink-0 text-xs font-bold text-amber-700 border border-amber-400 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-stone-900 text-sm">Apply Coupon</span>
              </div>
              {applied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div>
                    <span className="font-bold text-green-700 text-sm">{coupon.toUpperCase()}</span>
                    <p className="text-xs text-green-600">{applied.label}</p>
                  </div>
                  <button onClick={() => { setApplied(null); setCoupon(""); }} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} className="flex-1 bg-stone-50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                    <button onClick={applyCoupon} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">Apply</button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {["FIRST20", "SAVE05", "FLAT50"].map((c) => (
                      <button key={c} onClick={() => setCoupon(c)} className="text-[10px] font-bold text-amber-700 border border-amber-300 px-2.5 py-1 rounded-full hover:bg-amber-50 transition-colors">{c}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Summary */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-stone-600"><span>Subtotal</span><span className="font-medium text-stone-900">₹{subtotal}</span></div>
                {applied && <div className="flex justify-between text-green-700"><span>Discount ({applied.label})</span><span className="font-bold">−₹{discount}</span></div>}
                <div className="flex justify-between text-stone-600"><span>Delivery</span><span className={`font-medium ${delivery === 0 ? "text-green-700" : "text-stone-900"}`}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span></div>
                {delivery > 0 && <p className="text-xs text-muted-foreground">Add ₹{499 - subtotal} more for free delivery</p>}
                <div className="flex justify-between font-bold text-stone-900 text-base border-t border-border pt-3 mt-3">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
              <button
                onClick={() => navigate("checkout")}
                className="w-full mt-5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("shop")} className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
                Continue Shopping
              </button>
            </div>

            {/* Trust */}
            <div className="bg-stone-50 border border-border rounded-2xl p-4 space-y-2">
              {[{ e: "🔒", t: "Secure Checkout" }, { e: "🌾", t: "Freshly Milled Guarantee" }, { e: "↩️", t: "Easy Returns" }].map((i) => (
                <div key={i.t} className="flex items-center gap-2 text-xs text-stone-600"><span>{i.e}</span><span>{i.t}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
