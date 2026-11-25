"use client";

import { useEffect, useMemo, useState } from "react";
import { Weight } from "@/lib/cart";
import { csrfHeaders } from "@/lib/csrf";
import { formatPrice } from "@/lib/utils";

const apiBase = typeof window !== "undefined" ? "/api/v1" : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type SubscriptionProduct = {
  slug: string;
  name: string;
  price1: number;
  price5: number;
  price10: number;
};

export function SubscriptionAction({ slug, products }: { slug: string; products: SubscriptionProduct[] }) {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(slug);
  const [weight, setWeight] = useState<Weight>(5);
  const [quantity, setQuantity] = useState(1);
  const [cadence, setCadence] = useState<"15_days" | "30_days">("30_days");
  const [nextDeliveryAt, setNextDeliveryAt] = useState("");
  const [billingMode, setBillingMode] = useState<"wallet" | "manual">("wallet");
  const selectedProduct = useMemo(() => products.find((product) => product.slug === selectedSlug) ?? products[0], [products, selectedSlug]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get("product");
    if (requestedSlug && products.some((product) => product.slug === requestedSlug)) setSelectedSlug(requestedSlug);
    const saved = window.localStorage.getItem("wr_subscription_draft");
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as Partial<{ slug: string; weight: Weight; quantity: number; cadence: "15_days" | "30_days"; nextDeliveryAt: string; billingMode: "wallet" | "manual" }>;
      if (draft.slug && products.some((product) => product.slug === draft.slug)) setSelectedSlug(draft.slug);
      if (draft.weight === 1 || draft.weight === 5 || draft.weight === 10) setWeight(draft.weight);
      if (draft.quantity && draft.quantity > 0) setQuantity(Math.min(20, draft.quantity));
      if (draft.cadence === "15_days" || draft.cadence === "30_days") setCadence(draft.cadence);
      if (draft.nextDeliveryAt) setNextDeliveryAt(draft.nextDeliveryAt);
      if (draft.billingMode === "wallet" || draft.billingMode === "manual") setBillingMode(draft.billingMode);
    } catch {
      window.localStorage.removeItem("wr_subscription_draft");
    }
  }, [products]);

  async function subscribe() {
    setLoading(true);
    setStatus("");
    setError("");
    try {
      if (typeof document !== "undefined" && !document.cookie.includes("wr_access=")) {
        window.localStorage.setItem("wr_subscription_draft", JSON.stringify({ slug: selectedSlug, weight, quantity, cadence, nextDeliveryAt, billingMode }));
        window.location.assign(`/login?next=${encodeURIComponent(`/subscription?product=${selectedSlug}`)}`);
        return;
      }
      const startDate = nextDeliveryAt ? `${nextDeliveryAt}T00:00:00Z` : null;
      const response = await fetch(`${apiBase}/subscriptions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          slug: selectedSlug,
          weight_kg: weight,
          quantity,
          cadence,
          next_delivery_at: startDate,
          wallet_auto_deduct: billingMode === "wallet"
        })
      });
      if (response.status === 401) {
        window.localStorage.setItem("wr_subscription_draft", JSON.stringify({ slug: selectedSlug, weight, quantity, cadence, nextDeliveryAt, billingMode }));
        window.location.assign(`/login?next=${encodeURIComponent(`/subscription?product=${selectedSlug}`)}`);
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Could not create subscription");
      window.localStorage.removeItem("wr_subscription_draft");
      setStatus("Subscription created successfully. You can manage it from your account.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Subscription service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-bold">Monthly plan includes 10% off.</p>
        <p className="mt-1 text-xs leading-5 text-amber-800/80">Choose product, quantity and start date. Billing can auto-deduct from WR Wallet or stay manual for each cycle.</p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-stone-700">Select product</p>
        <div className="grid gap-2">
          {products.map((product) => (
            <button
              key={product.slug}
              type="button"
              aria-pressed={selectedProduct?.slug === product.slug}
              onClick={() => setSelectedSlug(product.slug)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${selectedProduct?.slug === product.slug ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"}`}
            >
              <span className="font-semibold">{product.name}</span>
              <span className="font-bold">{formatPrice(Math.round((product.price5 || product.price1) * 0.9))}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
        <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Product</span><span className="font-medium text-stone-900">{selectedProduct?.name ?? "Fresh atta"}</span></div>
        <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Plan</span><span className="font-medium text-stone-900">{cadence === "15_days" ? "Every 15 days" : "Every 30 days"}</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {([1, 5, 10] as Weight[]).map((option) => (
          <button key={option} type="button" onClick={() => setWeight(option)} className={`rounded-xl border px-3 py-2 text-xs font-black transition ${weight === option ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"}`}>{option} KG</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["15_days", "30_days"] as const).map((option) => (
          <button key={option} type="button" onClick={() => setCadence(option)} className={`rounded-xl border px-3 py-2 text-xs font-black transition ${cadence === option ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"}`}>{option === "15_days" ? "15 Days" : "30 Days"}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="h-10 w-10 rounded-full bg-stone-100 font-bold text-stone-700" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <span className="w-10 text-center font-black text-stone-900">{quantity}</span>
        <button type="button" className="h-10 w-10 rounded-full bg-stone-100 font-bold text-stone-700" onClick={() => setQuantity(quantity + 1)}>+</button>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-stone-700">
        Delivery starts from
        <input type="date" min={new Date().toISOString().slice(0, 10)} value={nextDeliveryAt} onChange={(event) => setNextDeliveryAt(event.target.value)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400" />
      </label>
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-stone-700">Billing mode</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "wallet", label: "WR Wallet auto-deduct" },
            { value: "manual", label: "Pay manually each cycle" }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setBillingMode(option.value as "wallet" | "manual")}
              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${billingMode === option.value ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs leading-5 text-stone-500">
        {billingMode === "wallet"
          ? "Recommended: wallet auto-deduct keeps the monthly subscription running without interruption."
          : "Manual billing keeps the order active, but each cycle will move to payment due until you clear it."}
      </p>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
        <span className="text-stone-500">Estimated per delivery</span>
        <strong className="text-lg text-stone-900">{formatPrice(Math.round(((selectedProduct?.[`price${weight}` as "price1" | "price5" | "price10"] ?? selectedProduct?.price5) ?? 0) * 0.9) * quantity)}</strong>
      </div>
      <button type="button" onClick={subscribe} disabled={loading || !selectedProduct} className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Activating..." : "Subscribe"}
      </button>
      {status ? <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">{status}</p> : null}
      {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-800">{error}</p> : null}
    </div>
  );
}
