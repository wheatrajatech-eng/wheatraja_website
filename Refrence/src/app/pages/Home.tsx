import { useState, useEffect, useCallback } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ArrowRight, BadgeCheck, Award, Zap, Truck, Shield, Leaf,
  Heart, Package, RefreshCw, Share2, Gift,
  Clock, Check, MapPin, Phone, Mail, Instagram, Facebook, Youtube, ChevronDown, X,
} from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS, REVIEWS, FAQS, IMGS } from "../data";
import { ProductCard, StarRow } from "../shared";

function useCountdown(h: number) {
  const calc = useCallback(() => {
    const now = new Date(), end = new Date();
    end.setHours(h, 0, 0, 0);
    if (now >= end) end.setDate(end.getDate() + 1);
    const d = end.getTime() - now.getTime();
    return { h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) };
  }, [h]);
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return t;
}

const FEATURES = [
  { icon: Zap, title: "Freshly Milled After Order", desc: "Never pre-ground. Never stored. Milled the moment you order." },
  { icon: Award, title: "Premium Wheat Selection", desc: "Hand-picked varieties from certified farms across India." },
  { icon: Package, title: "Stone Ground Process", desc: "Traditional chakki method preserves bran, germ & nutrition." },
  { icon: Leaf, title: "Nutrient Rich", desc: "Maximum vitamins, minerals and dietary fibre retained." },
  { icon: Heart, title: "Soft Rotis Every Time", desc: "Fresh gluten structure makes visibly softer rotis." },
  { icon: Check, title: "Better Digestion", desc: "Whole wheat freshness aids gut health naturally." },
  { icon: Shield, title: "No Preservatives", desc: "Zero artificial additives. Just pure wheat. Nothing else." },
  { icon: Truck, title: "Doorstep Delivery", desc: "Free delivery across NCR. Scheduled to your convenience." },
];

export function Home() {
  const { navigate, addToCart } = useApp();
  const countdown = useCountdown(23);
  const [pincode, setPincode] = useState("");
  const [pincodeResult, setPincodeResult] = useState<"valid" | "invalid" | null>(null);
  const [subProductId, setSubProductId] = useState(2);
  const [subFreq, setSubFreq] = useState("monthly");

  const subProduct = PRODUCTS.find((p) => p.id === subProductId) ?? PRODUCTS[0];

  const checkPin = () => {
    setPincodeResult(pincode.length === 6 && (pincode.startsWith("201") || pincode.startsWith("110") || pincode.startsWith("122")) ? "valid" : "invalid");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-950">
        <img src={IMGS.hero} alt="Golden wheat field" className="absolute inset-0 w-full h-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />
        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-10 text-center pt-24 pb-16">
          <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-widest px-5 py-2 rounded-full mb-8 border border-white/20">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
            Freshly Milled After Every Order
          </div>
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold text-white leading-[1.04] tracking-tight mb-7">
            Freshly Milled<br />
            <em className="not-italic text-amber-400">Atta.</em> Delivered<br />
            Fresh. Every Time.
          </h1>
          <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-11 font-light leading-relaxed">
            Premium Chakki Fresh Atta made after you order. Never stored. Never stale. Nutritious in every roti.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button onClick={() => navigate("shop")} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-base px-9 py-4 rounded-full transition-all shadow-xl shadow-amber-600/25 hover:-translate-y-0.5">
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate("shop")} className="inline-flex items-center gap-2 bg-white/12 hover:bg-white/20 backdrop-blur-sm text-white font-semibold text-base px-9 py-4 rounded-full border border-white/25 transition-all">
              Subscribe &amp; Save 10%
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[{ icon: BadgeCheck, label: "FSSAI Approved" }, { icon: Award, label: "NABL Certified" }, { icon: Zap, label: "Freshly Milled" }, { icon: Truck, label: "Home Delivery" }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/18 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Icon className="w-4 h-4 text-amber-400" />{label}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 text-[10px] uppercase tracking-widest">
          <span>Scroll</span><ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* Products */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="text-center mb-14">
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">Our Collection</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">Premium Atta Range</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">Every variety stone-ground fresh, packed with nutrition, delivered to your door.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={() => navigate("product", { productId: p.id })} />
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate("shop")} className="inline-flex items-center gap-2 border-2 border-amber-600 text-amber-700 font-semibold px-8 py-3 rounded-full hover:bg-amber-600 hover:text-white transition-all">
              View All Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Why Wheat Raja */}
      <section className="py-20 md:py-28 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">The Difference</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-5">Why Wheat Raja Stands Apart</h2>
              <p className="text-white/55 text-base leading-relaxed">Over 10,000 families have made the switch. Eight reasons they never look back.</p>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video bg-stone-800">
              <img src={IMGS.stone} alt="Traditional stone mill grinding fresh wheat" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-white/5 hover:bg-amber-500/10 border border-white/8 hover:border-amber-500/30 rounded-2xl p-5 md:p-6 transition-all cursor-default">
                <div className="w-10 h-10 bg-amber-500/20 group-hover:bg-amber-500/30 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5 leading-snug">{title}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">Subscribe &amp; Save</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-5">Never Run Out Of Fresh Atta</h2>
              <p className="text-muted-foreground mb-9 leading-relaxed">Set it, forget it, savour it. Your freshly milled atta arrives on schedule — every single time.</p>
              <div className="space-y-4">
                {[
                  { e: "💰", t: "10% Discount", d: "On every subscription delivery, every time" },
                  { e: "⚡", t: "Priority Delivery", d: "Subscribers skip the queue automatically" },
                  { e: "🔄", t: "Auto Refill", d: "Never think about reordering again" },
                  { e: "📅", t: "Flexible Schedule", d: "Pause, skip or cancel anytime, no charges" },
                ].map((item) => (
                  <div key={item.t} className="flex items-start gap-3.5">
                    <span className="text-xl mt-0.5">{item.e}</span>
                    <div><span className="font-semibold text-stone-900 text-sm">{item.t}</span><span className="text-muted-foreground text-sm"> — {item.d}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-serif font-bold text-stone-900 text-xl mb-6">Configure Your Plan</h3>
              <div className="mb-5">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Select Product</p>
                <div className="space-y-2">
                  {PRODUCTS.map((p) => (
                    <button key={p.id} onClick={() => setSubProductId(p.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all text-sm ${subProductId === p.id ? "border-amber-500 bg-amber-50 text-amber-900" : "border-border hover:border-amber-300 text-stone-700"}`}>
                      <span className="font-medium">{p.name} — {p.weight}</span>
                      <span className="font-bold">₹{p.subPrice}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-7">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Delivery Frequency</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: "weekly", l: "Weekly" }, { v: "biweekly", l: "Bi-Weekly" }, { v: "monthly", l: "Monthly" }].map(({ v, l }) => (
                    <button key={v} onClick={() => setSubFreq(v)} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${subFreq === v ? "border-amber-500 bg-amber-600 text-white" : "border-border text-stone-600 hover:border-amber-300"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 text-sm">
                <div className="flex justify-between mb-1.5"><span className="text-stone-500">Product</span><span className="font-medium text-stone-900">{subProduct.name}</span></div>
                <div className="flex justify-between mb-1.5"><span className="text-stone-500">Frequency</span><span className="font-medium text-stone-900 capitalize">{subFreq === "biweekly" ? "Bi-Weekly" : subFreq.charAt(0).toUpperCase() + subFreq.slice(1)}</span></div>
                <div className="flex justify-between border-t border-amber-200 pt-3 mt-3">
                  <span className="font-bold text-stone-800">You Pay</span>
                  <div><span className="font-bold text-amber-700 text-lg">₹{subProduct.subPrice}</span><span className="text-xs text-stone-400 ml-1">/ delivery</span></div>
                </div>
              </div>
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" /> Subscribe Now — Save 10%
              </button>
              <p className="text-center text-xs text-muted-foreground mt-3">Cancel or pause anytime. No hidden charges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Offers */}
      <section className="py-16 md:py-20 bg-amber-600">
        <div className="max-w-5xl mx-auto px-5 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            <Clock className="w-3 h-3" /> Limited Time Offer
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-3">20% Off Your First Order</h2>
          <p className="text-white/80 mb-8 text-sm">Use code <span className="bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-md tracking-wider">SAVE05</span> at checkout. Offer ends tonight.</p>
          <div className="flex justify-center gap-3 mb-12">
            {[{ l: "Hours", v: String(countdown.h).padStart(2, "0") }, { l: "Mins", v: String(countdown.m).padStart(2, "0") }, { l: "Secs", v: String(countdown.s).padStart(2, "0") }].map(({ l, v }) => (
              <div key={l} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/18 border border-white/25 rounded-xl flex items-center justify-center font-serif font-bold text-2xl md:text-3xl text-white tabular-nums">{v}</div>
                <span className="text-white/55 text-[10px] uppercase tracking-widest mt-1.5">{l}</span>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: "First Order Offer", d: "20% off on your very first purchase", c: "FIRST20", n: "Min. ₹199" },
              { t: "Free 1 KG Multigrain", d: "Complimentary bag on orders above ₹999", c: "FREE1KG", n: "Min. ₹999" },
              { t: "Subscription Saver", d: "Extra 5% off when you subscribe today", c: "SAVE05", n: "Any order" },
            ].map((o) => (
              <div key={o.t} className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-left">
                <h4 className="font-serif font-bold text-white mb-1 text-base">{o.t}</h4>
                <p className="text-white/65 text-xs mb-4 leading-relaxed">{o.d}</p>
                <div className="flex items-center justify-between">
                  <span className="bg-white text-amber-700 font-bold text-xs px-3 py-1.5 rounded-full tracking-wide">{o.c}</span>
                  <span className="text-white/55 text-xs">{o.n}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="text-center mb-14">
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">Real Customers</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">10,000+ Happy Families</h2>
            <div className="flex items-center justify-center gap-2">
              <StarRow rating={4.9} size="md" /><span className="font-bold text-lg ml-1">4.9</span><span className="text-muted-foreground text-sm">· Google Reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm shrink-0">{r.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-sm">{r.name}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-semibold">
                        <BadgeCheck className="w-3 h-3" /> Verified
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.location}</div>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery */}
      <section className="py-20 md:py-28 bg-background">
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-200 shadow-sm">
              <img src={IMGS.hero} alt="Delivery coverage" className="w-full h-full object-cover opacity-35" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center shadow-lg mb-3"><MapPin className="w-7 h-7 text-white" /></div>
                <h3 className="font-serif font-bold text-stone-900 text-lg mb-0.5">Sector 78, Noida</h3>
                <p className="text-stone-600 text-xs mb-6">Fulfillment Center</p>
                <div className="space-y-2 w-full max-w-xs">
                  {[{ z: "0 – 20 km", l: "Free Delivery", c: "text-green-700" }, { z: "20 – 30 km", l: "₹29", c: "text-amber-700" }, { z: "30 – 50 km", l: "₹49", c: "text-stone-700" }].map((d) => (
                    <div key={d.z} className="flex items-center justify-between bg-white/85 backdrop-blur-sm rounded-full px-4 py-2">
                      <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-amber-600" /><span className="text-stone-700 text-xs font-medium">{d.z}</span></div>
                      <span className={`font-bold text-xs ${d.c}`}>{d.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">Delivery Coverage</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-4">We Deliver To Your Doorstep</h2>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">Fresh atta delivered across NCR. Free delivery within 20 km of our Sector 78 fulfillment center.</p>
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Enter your Pincode" maxLength={6} value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); setPincodeResult(null); }} className="flex-1 bg-muted rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm border-2 border-transparent focus:border-amber-400 focus:outline-none focus:bg-white transition-all" />
                <button onClick={checkPin} disabled={pincode.length < 6} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">Check</button>
              </div>
              {pincodeResult && (
                <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 ${pincodeResult === "valid" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {pincodeResult === "valid"
                    ? <><Check className="w-4 h-4 mt-0.5 shrink-0" /><span>Great news! We deliver to your area. <strong>Free delivery available.</strong></span></>
                    : <><X className="w-4 h-4 mt-0.5 shrink-0" /><span>We don&apos;t deliver here yet — but we&apos;re expanding soon!</span></>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {["Noida", "Greater Noida", "Ghaziabad", "Delhi NCR", "Gurugram", "Faridabad"].map((city) => (
                  <div key={city} className="flex items-center gap-2 text-sm text-stone-600">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-green-600" /></div>{city}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-stone-50">
        <div className="max-w-3xl mx-auto px-5 md:px-10">
          <div className="text-center mb-14">
            <p className="text-amber-700 text-xs font-bold uppercase tracking-widest mb-3">Got Questions?</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <Accordion.Item key={i} value={`faq-${i}`} className="bg-white border border-border rounded-2xl overflow-hidden">
                <Accordion.Trigger className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group hover:bg-stone-50 transition-colors">
                  <span className="font-semibold text-stone-900 text-sm leading-snug">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <div className="px-6 pb-5 pt-1 text-muted-foreground text-sm leading-relaxed border-t border-border">{faq.a}</div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 md:px-10">
          <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center"><span className="text-white font-bold text-xs">WR</span></div>
                <span className="font-serif font-bold text-xl">Wheat Raja</span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed mb-6">Freshly milled atta delivered to your doorstep. FSSAI Approved. NABL Certified.</p>
              <div className="flex gap-2.5">{[Instagram, Facebook, Youtube].map((Icon, i) => <a key={i} href="#" className="w-9 h-9 bg-white/8 hover:bg-amber-600/30 border border-white/8 rounded-full flex items-center justify-center transition-colors"><Icon className="w-4 h-4 text-white/55" /></a>)}</div>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-5">Products</h4>
              <div className="space-y-2.5">{["Multigrain Atta", "MP Sharbati Atta", "Sehori Atta", "Subscription Plans"].map((l) => <button key={l} onClick={() => navigate("shop")} className="block text-sm text-white/45 hover:text-white transition-colors">{l}</button>)}</div>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-5">Account</h4>
              <div className="space-y-2.5">{[["Dashboard", "dashboard"], ["Orders", "dashboard"], ["Wallet", "dashboard"], ["Referral", "dashboard"]].map(([l, pg]) => <button key={l} onClick={() => navigate(pg as any)} className="block text-sm text-white/45 hover:text-white transition-colors">{l}</button>)}</div>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-5">Contact</h4>
              <div className="space-y-3.5 mb-7">
                <div className="flex items-center gap-2.5 text-sm text-white/45"><Phone className="w-4 h-4 text-amber-500 shrink-0" />+91 98765 43210</div>
                <div className="flex items-center gap-2.5 text-sm text-white/45"><Mail className="w-4 h-4 text-amber-500 shrink-0" />hello@wheatraja.com</div>
                <div className="flex items-start gap-2.5 text-sm text-white/45"><MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />Sector 78, Noida, UP 201309</div>
              </div>
              <div className="flex gap-2">{["FSSAI", "NABL", "ISO 22000"].map((c) => <span key={c} className="text-[10px] bg-white/8 border border-white/10 text-white/50 px-2.5 py-1 rounded-full">{c}</span>)}</div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/25">
            <span>© 2024 Wheat Raja. All rights reserved.</span>
            <div className="flex gap-5">{["Privacy Policy", "Terms", "Shipping", "Returns"].map((l) => <a key={l} href="#" className="hover:text-white/50 transition-colors">{l}</a>)}</div>
          </div>
        </div>
      </footer>

    </div>
  );
}
