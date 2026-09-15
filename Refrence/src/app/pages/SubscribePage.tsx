import { useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronDown, ChevronUp, RefreshCw, Shield, Zap, Truck, Star, ArrowRight } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS } from "../data";

const PLANS = [
  {
    id: "weekly",
    label: "Weekly",
    desc: "Fresh atta every week",
    discount: 15,
    badge: "Best Value",
    highlight: true,
  },
  {
    id: "biweekly",
    label: "Bi-Weekly",
    desc: "Every two weeks",
    discount: 10,
    badge: null,
    highlight: false,
  },
  {
    id: "monthly",
    label: "Monthly",
    desc: "Once a month delivery",
    discount: 5,
    badge: null,
    highlight: false,
  },
];

const BENEFITS = [
  { icon: Shield, title: "Skip or Pause Anytime", desc: "No lock-ins. Pause, skip, or cancel your subscription at any time with a single tap." },
  { icon: Zap, title: "Priority Milling", desc: "Subscribers get their atta milled first. Your order is always freshest." },
  { icon: Truck, title: "Free Delivery", desc: "Every subscription delivery is free, no minimum order required." },
  { icon: RefreshCw, title: "Never Run Out", desc: "Your atta arrives before you need it. Set your frequency and forget." },
  { icon: Star, title: "Exclusive Discounts", desc: "Up to 15% off regular prices, plus early access to new varieties." },
  { icon: Check, title: "Flexible Quantities", desc: "Change your quantity for any delivery — more during guests, less when traveling." },
];

const FAQS = [
  { q: "Can I change my frequency after subscribing?", a: "Yes, you can change your delivery frequency at any time from your dashboard. Changes take effect from your next order." },
  { q: "What if I want to pause my subscription?", a: "You can pause your subscription for up to 3 months. Resume whenever you're ready — no penalties." },
  { q: "Is there a minimum subscription period?", a: "No minimum period. You can cancel after your very first delivery if you're not satisfied." },
  { q: "Can I subscribe to multiple products?", a: "Absolutely! You can have separate subscriptions for each product variety with different frequencies." },
  { q: "How is payment handled?", a: "We auto-deduct from your Wheat Raja Wallet before each delivery. You'll receive a WhatsApp notification 24 hours in advance." },
  { q: "What happens if I'm not home during delivery?", a: "Our delivery partner will attempt re-delivery the same day. You can also choose to leave it with a neighbor or security." },
];

const REVIEWS = [
  { name: "Sunita Agarwal", location: "Noida Sector 50", text: "I've been subscribing for 6 months now. Never had to think about running out of atta again. The freshness is remarkable.", rating: 5 },
  { name: "Rajeev Malhotra", location: "Gurugram", text: "The bi-weekly subscription is perfect for our family of 4. Saves me 10% and I don't have to remember to reorder.", rating: 5 },
  { name: "Priya Krishnamurthy", location: "Delhi NCR", text: "Tried cancelling once just to test — it was literally one button. Came back immediately because nothing else compares.", rating: 5 },
];

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.45, ease: "easeOut" } };

export function SubscribePage() {
  const { navigate, addToCart } = useApp();
  const [selectedPlan, setSelectedPlan] = useState("weekly");
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0].id);
  const [qty, setQty] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;
  const product = PRODUCTS.find((p) => p.id === selectedProduct)!;
  const originalPrice = product.price * qty;
  const discountedPrice = Math.round(originalPrice * (1 - plan.discount / 100));

  const handleSubscribe = () => {
    addToCart(selectedProduct, qty);
    navigate("checkout");
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero */}
      <section className="bg-stone-900 py-20 px-5 md:px-10 text-center">
        <motion.div {...fade}>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Subscription Plans</p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">
            Fresh Atta,<br />Every Time. Automatically.
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Subscribe and save up to 15%. Cancel or pause any time. No contracts, no stress.</p>
        </motion.div>
      </section>

      {/* Plan selector */}
      <section className="py-16 px-5 md:px-10">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">Choose Your Delivery Frequency</h2>
            <p className="text-muted-foreground text-sm">More frequent = bigger discount</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {PLANS.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all ${selectedPlan === p.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-border bg-card hover:border-amber-300"
                  }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-6 bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{p.badge}</span>
                )}
                <div className={`w-5 h-5 rounded-full border-2 mb-4 flex items-center justify-center ${selectedPlan === p.id ? "border-amber-600 bg-amber-600" : "border-stone-300"}`}>
                  {selectedPlan === p.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-xl mb-1">{p.label}</h3>
                <p className="text-muted-foreground text-sm mb-4">{p.desc}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-amber-700">{p.discount}% off</span>
                  <span className="text-xs text-muted-foreground">every delivery</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Product + qty selector */}
          <motion.div {...fade} className="bg-card border border-border rounded-2xl p-7 mb-8">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-5">Configure Your Subscription</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Select Product</label>
                <div className="space-y-2">
                  {PRODUCTS.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedProduct === prod.id ? "border-amber-400 bg-amber-50" : "border-border hover:border-amber-200"}`}
                    >
                      <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 text-sm">{prod.name}</p>
                        <p className="text-xs text-muted-foreground">{prod.weight}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-700">₹{Math.round(prod.price * (1 - plan.discount / 100))}</p>
                        <p className="text-xs text-muted-foreground line-through">₹{prod.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">Quantity Per Delivery</label>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold text-stone-700 hover:border-amber-400 transition-colors">−</button>
                  <span className="font-bold text-stone-900 text-xl w-8 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-bold text-stone-700 hover:border-amber-400 transition-colors">+</button>
                  <span className="text-sm text-muted-foreground">bag{qty > 1 ? "s" : ""} × 5 kg</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-stone-600">Regular price</span>
                    <span className="line-through text-muted-foreground">₹{originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-stone-600">{plan.label} discount ({plan.discount}%)</span>
                    <span className="text-green-700 font-semibold">−₹{originalPrice - discountedPrice}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-amber-200 pt-2 mt-2">
                    <span className="text-stone-900">Per delivery</span>
                    <span className="text-amber-700">₹{discountedPrice}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">+ Free delivery always</p>
                </div>

                <button
                  onClick={handleSubscribe}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  Start Subscription <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-xs text-muted-foreground mt-3">No commitment. Cancel any time.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-stone-900 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fade} className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-white mb-2">Why Subscribe?</h2>
            <p className="text-white/60 text-sm">Beyond the discount — here's the full picture.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{b.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-5 md:px-10 bg-background">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">Subscribers Love It</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {REVIEWS.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array(r.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 text-sm leading-relaxed mb-4 italic">"{r.text}"</p>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-5 md:px-10 bg-stone-50 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade} className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-stone-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-stone-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
