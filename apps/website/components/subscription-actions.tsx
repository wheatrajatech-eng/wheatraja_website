"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { Weight } from "@/lib/cart";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export function SubscriptionAction({ slug }: { slug: string }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [weight, setWeight] = useState<Weight>(10);
  const [quantity, setQuantity] = useState(1);
  const [cadence, setCadence] = useState<"15_days" | "30_days">("30_days");
  const [nextDeliveryAt, setNextDeliveryAt] = useState("");
  const [billingMode, setBillingMode] = useState<"wallet" | "manual">("wallet");

  async function subscribe() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBase}/subscriptions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          weight_kg: weight,
          quantity,
          cadence,
          next_delivery_at: nextDeliveryAt || null,
          wallet_auto_deduct: billingMode === "wallet"
        })
      });
      if (response.status === 401) {
        addToCart({ slug, weight, quantity, subscription: true });
        setStatus("Added subscription pack to cart. Login at checkout to activate.");
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not create subscription");
      setStatus("Subscription created. Manage it from your account.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create subscription");
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
        <input type="date" value={nextDeliveryAt} onChange={(event) => setNextDeliveryAt(event.target.value)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400" />
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
      <button type="button" onClick={subscribe} disabled={loading} className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50">
        {loading ? "Activating..." : "Subscribe"}
      </button>
      {status ? <p className="mt-3 text-xs font-bold text-stone-500">{status}</p> : null}
    </div>
  );
}
