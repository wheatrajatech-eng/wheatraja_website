import { useState } from "react";
import { ArrowLeft, MapPin, Plus, Check, CreditCard, Smartphone, Wallet } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS } from "../data";

const PRICES = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price]));

const SAVED_ADDRESSES = [
  { id: 1, label: "Home", name: "Rohit Sharma", line: "45-B, Sector 45", city: "Noida", pin: "201301", phone: "9812345670" },
  { id: 2, label: "Work", name: "Rohit Sharma", line: "Building 7, Sector 63 IT Park", city: "Noida", pin: "201307", phone: "9812345670" },
];

export function Checkout() {
  const { cart, navigate, cartTotal, user, clearCart, walletBalance, withdrawFromWallet } = useApp();
  const [step, setStep] = useState<"address" | "payment">("address");
  const [selectedAddr, setSelectedAddr] = useState(1);
  const [payMethod, setPayMethod] = useState<"upi" | "card" | "cod" | "wallet">("upi");
  const [upiId, setUpiId] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [placing, setPlacing] = useState(false);

  const subtotal = cartTotal(PRICES);
  const delivery = subtotal >= 499 ? 0 : 29;
  const walletDiscount = useWallet ? Math.min(walletBalance, subtotal + delivery) : 0;
  const total = subtotal + delivery - walletDiscount;

  const placeOrder = () => {
    setPlacing(true);
    if (useWallet && walletDiscount > 0) withdrawFromWallet(walletDiscount);
    setTimeout(() => { clearCart(); navigate("success"); }, 1500);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-4xl mx-auto px-5 md:px-10 py-10">
        {/* Header */}
        <button onClick={() => navigate("cart")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </button>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-3 mb-8">
          {[{ id: "address", label: "Delivery Address" }, { id: "payment", label: "Payment" }].map(({ id, label }, i) => (
            <div key={id} className="flex items-center gap-3">
              {i > 0 && <div className={`h-px w-8 ${step === "payment" ? "bg-amber-500" : "bg-stone-200"}`} />}
              <div className={`flex items-center gap-2 text-sm font-semibold ${step === id || (step === "payment" && id === "address") ? "text-amber-700" : "text-muted-foreground"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === id ? "bg-amber-600 text-white" : step === "payment" && id === "address" ? "bg-green-600 text-white" : "bg-stone-200 text-stone-500"}`}>
                  {step === "payment" && id === "address" ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {step === "address" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-stone-900 mb-4">Select Delivery Address</h2>
                {SAVED_ADDRESSES.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddr(addr.id)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${selectedAddr === addr.id ? "border-amber-500 bg-amber-50" : "border-border bg-card hover:border-amber-300"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedAddr === addr.id ? "border-amber-500 bg-amber-500" : "border-stone-300"}`}>
                        {selectedAddr === addr.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-stone-900 text-sm">{addr.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">{addr.label}</span>
                        </div>
                        <p className="text-sm text-stone-600">{addr.line}, {addr.city} — {addr.pin}</p>
                        <p className="text-xs text-muted-foreground mt-1">📱 {addr.phone}</p>
                      </div>
                    </div>
                  </button>
                ))}
                <button className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700 py-4 rounded-2xl transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
                <button onClick={() => setStep("payment")} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors mt-2">
                  Continue to Payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div>
                <h2 className="font-semibold text-stone-900 mb-4">Select Payment Method</h2>

                {/* Wallet toggle */}
                <div className={`p-5 rounded-2xl border-2 mb-4 transition-all ${useWallet ? "border-amber-500 bg-amber-50" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-amber-700" /></div>
                      <div>
                        <p className="font-semibold text-stone-900 text-sm">Use Wheat Raja Wallet</p>
                        <p className="text-xs text-green-700 font-medium">Balance: ₹{walletBalance.toLocaleString("en-IN")} available</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseWallet(!useWallet)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${useWallet ? "bg-amber-500" : "bg-stone-200"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useWallet ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                  </div>
                  {useWallet && walletDiscount > 0 && (
                    <p className="text-xs text-amber-700 font-medium mt-2">₹{walletDiscount} will be deducted from your wallet</p>
                  )}
                </div>

                {total > 0 && (
                  <div className="space-y-3">
                    {[
                      { id: "upi", label: "UPI / BHIM / PhonePe / GPay", icon: Smartphone },
                      { id: "card", label: "Credit / Debit Card", icon: CreditCard },
                      { id: "cod", label: "Cash on Delivery", icon: MapPin },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setPayMethod(id as any)}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${payMethod === id ? "border-amber-500 bg-amber-50" : "border-border bg-card hover:border-amber-300"}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${payMethod === id ? "border-amber-500 bg-amber-500" : "border-stone-300"}`}>
                          {payMethod === id && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <Icon className="w-5 h-5 text-stone-600 shrink-0" />
                        <span className="font-medium text-stone-900 text-sm">{label}</span>
                      </button>
                    ))}

                    {payMethod === "upi" && (
                      <input
                        type="text"
                        placeholder="Enter UPI ID (e.g. name@upi)"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-stone-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    )}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-700 disabled:opacity-70 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order…</>
                  ) : (
                    <>Place Order — ₹{total}</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
              <h3 className="font-semibold text-stone-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm mb-4">
                {cart.map((item) => {
                  const p = PRODUCTS.find((x) => x.id === item.productId);
                  if (!p) return null;
                  return (
                    <div key={item.productId} className="flex justify-between">
                      <span className="text-stone-600">{p.name} × {item.qty}</span>
                      <span className="font-medium">₹{p.price * item.qty}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-stone-600"><span>Delivery</span><span className={delivery === 0 ? "text-green-700" : ""}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span></div>
                {useWallet && walletDiscount > 0 && <div className="flex justify-between text-green-700"><span>Wallet</span><span>−₹{walletDiscount}</span></div>}
                <div className="flex justify-between font-bold text-stone-900 text-base border-t border-border pt-2 mt-2"><span>Total</span><span>₹{total}</span></div>
              </div>
              <div className="mt-4 p-3 bg-stone-50 rounded-xl">
                <p className="text-xs text-stone-600 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-600" />{SAVED_ADDRESSES.find(a => a.id === selectedAddr)?.line}, {SAVED_ADDRESSES.find(a => a.id === selectedAddr)?.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderSuccess() {
  const { navigate } = useApp();
  return (
    <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-5 text-center py-20">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-3">Order Placed! 🎉</h1>
        <p className="text-muted-foreground mb-2">Your order <span className="font-bold text-stone-900">#WR2024001302</span> has been confirmed.</p>
        <p className="text-sm text-muted-foreground mb-8">Your fresh atta will be milled and delivered within 24–48 hours. You'll receive an SMS and WhatsApp update.</p>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 text-left">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">WR</span></div>
            <div><p className="font-semibold text-stone-900 text-sm">Wheat Raja Wallet</p><p className="text-xs text-green-700">+10 Points earned on this order!</p></div>
          </div>
          <p className="text-xs text-stone-600">You now have 850 Points = ₹850 in your wallet</p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate("tracking")} className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-3.5 rounded-full transition-colors">
            Track My Order
          </button>
          <button onClick={() => navigate("shop")} className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
