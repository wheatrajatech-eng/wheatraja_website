"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BadgeCheck, Building2, Check, Clock3, Loader2, MessageCircle, PackageCheck, Send, Sparkles, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

const skuOptions = [
  { id: "normal-wheat-roti", label: "Normal Wheat Roti", unitPrice: 2, note: "Everyday office lunch staple" },
  { id: "sharbati-wheat-roti", label: "Sharbati Wheat Roti", unitPrice: 3.5, note: "Soft texture with premium wheat" },
  { id: "multigrain-roti", label: "Multigrain Roti", unitPrice: 5, note: "Balanced grain blend for daily meals" },
  { id: "premium-sharbati-roti", label: "Premium Sharbati Wheat Roti", unitPrice: 5, note: "Higher-grade premium service" },
  { id: "missi-roti", label: "Missi Roti", unitPrice: 5, note: "Hearty blend for variety menus" },
  { id: "beet-root-roti", label: "Beet Root Roti", unitPrice: 5, note: "Colourful, menu-friendly option" },
  { id: "palak-ki-roti", label: "Palak Ki Roti", unitPrice: 6, note: "Fresh spinach-based roti" },
  { id: "tawa-parantha", label: "Tawa Parantha", unitPrice: 10, note: "Heavier breakfast / lunch option" }
] as const;

const useCases = [
  { title: "Corporate offices", text: "Daily employee lunch, pantry supply, and recurring meal programs." },
  { title: "Cafeterias", text: "Consistent rotis for canteens, lunch counters, and managed food courts." },
  { title: "Food vendors", text: "Tiffin providers, cloud kitchens, and commercial meal suppliers." },
  { title: "Event catering", text: "Bulk batches for office events, meetings, and working lunches." }
];

const steps = [
  "Choose your roti mix and quantities",
  "Share company, contact and delivery details",
  "Meet the Rs 1000 minimum order value",
  "Our team confirms freshness and schedule"
];

const faqs = [
  {
    q: "Minimum order value kya hai?",
    a: "Bulk chapati ordering ke liye minimum order value Rs 1000 hai."
  },
  {
    q: "Mixed SKUs allowed hain?",
    a: "Haan, aap multiple roti types mix kar sakte ho. Summary total minimum value cross karna chahiye."
  },
  {
    q: "Is page se enquiry kaam karegi?",
    a: "Haan, form existing WheatRaja contact endpoint ko submit karta hai aur team ko enquiry bhejta hai."
  },
  {
    q: "Recurring supply possible hai?",
    a: "Haan. Notes me weekly ya monthly supply mention kar sakte ho, team follow up karegi."
  }
];

function formatUnitPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value);
}

export function BulkOrderClient() {
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliverySlot, setDeliverySlot] = useState("Lunch");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(skuOptions.map((sku) => [sku.id, 0]))
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const items = useMemo(
    () =>
      skuOptions
        .map((sku) => ({
          ...sku,
          quantity: quantities[sku.id] ?? 0,
          total: (quantities[sku.id] ?? 0) * sku.unitPrice
        }))
        .filter((item) => item.quantity > 0),
    [quantities]
  );

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const remaining = Math.max(0, 1000 - subtotal);
  const meetsMinimum = subtotal >= 1000;

  function updateQuantity(id: string, delta: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] ?? 0) + delta)
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyName.trim() || contact.trim().length < 8) {
      setStatus("Company name aur contact number/email add karo.");
      return;
    }
    if (!meetsMinimum) {
      setStatus("Bulk order submit karne ke liye Rs 1000 minimum value cross karo.");
      return;
    }

    setLoading(true);
    setStatus("");
    setSent(false);

    const orderSummary = items
      .map((item) => `${item.label} x ${item.quantity} = ${formatUnitPrice(item.total)}`)
      .join(", ");

    const message = [
      "Bulk Chapati Order Enquiry",
      `Company: ${companyName.trim()}`,
      `Contact: ${contact.trim()}`,
      deliveryLocation.trim() ? `Location: ${deliveryLocation.trim()}` : null,
      `Preferred Slot: ${deliverySlot}`,
      `Total Items: ${totalItems}`,
      `Subtotal: ${formatUnitPrice(subtotal)}`,
      `Order Mix: ${orderSummary || "No SKUs selected"}`,
      notes.trim() ? `Notes: ${notes.trim()}` : null
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const response = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.trim(),
          phone: contact.trim(),
          message
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not send bulk enquiry");
      setSent(true);
      setStatus(`Bulk enquiry #${data.id} received. Our team will contact you shortly.`);
      setNotes("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send bulk enquiry");
    } finally {
      setLoading(false);
    }
  }

  const whatsappLink = useMemo(() => {
    const text = [
      "Hi WheatRaja, I want a bulk chapati quote.",
      `Company: ${companyName || "-"}`,
      `Contact: ${contact || "-"}`,
      `Subtotal: ${formatUnitPrice(subtotal)}`,
      `Slot: ${deliverySlot}`,
      `Location: ${deliveryLocation || "-"}`
    ].join("\n");
    return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
  }, [companyName, contact, deliveryLocation, deliverySlot, subtotal]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["MOQ", "Rs 1000 minimum"],
          ["Use case", "Corporate kitchens & vendors"],
          ["Supply", "Fresh batch after order"],
          ["Support", "WhatsApp + form enquiry"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">{label}</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.10)] md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                <Building2 size={14} /> Bulk chapati ordering
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-700">
                <Sparkles size={14} /> Freshness first
              </span>
            </div>
            <h2 className="mt-5 font-serif text-3xl leading-tight text-stone-950 md:text-5xl">
              Fresh rotis for offices, cafeterias and corporate food suppliers.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600 md:text-base">
              WheatRaja ka bulk chapati module corporate lunch programs, tiffin vendors, canteens aur recurring office supply ke liye design kiya gaya hai.
              Aap mixed SKUs choose kar sakte ho, total minimum order value cross kar sakte ho aur team ko enquiry bhej sakte ho.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                "Freshly prepared after order",
                "Mixed roti assortment allowed",
                "Corporate / vendor friendly response"
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                  <Check className="mt-0.5 shrink-0 text-amber-600" size={16} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="font-serif text-2xl text-stone-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[28px] bg-stone-950 p-6 text-white shadow-[0_24px_70px_rgba(28,25,23,.22)] md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">How it works</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {steps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">Step {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.08)] md:p-8">
            <div className="flex items-center gap-3">
              <UtensilsCrossed className="text-amber-700" size={22} />
              <h3 className="font-serif text-3xl text-stone-950">SKU menu</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">Per-piece pricing aur quantity mix yahin set karo. Minimum order value Rs 1000 cross hona chahiye.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {skuOptions.map((sku) => {
                const quantity = quantities[sku.id] ?? 0;
                return (
                  <div key={sku.id} className="rounded-[22px] border border-stone-200 bg-stone-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-2xl text-stone-950">{sku.label}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">{sku.note}</p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1.5 text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">Price</p>
                        <p className="text-sm font-bold text-stone-900">{formatUnitPrice(sku.unitPrice)} / pc</p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(sku.id, -1)}
                        className="h-10 w-10 rounded-full border border-stone-200 text-lg font-bold text-stone-700 transition hover:border-amber-400 hover:text-amber-700"
                        aria-label={`Decrease ${sku.label}`}
                      >
                        -
                      </button>
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Quantity</p>
                        <p className="font-serif text-3xl text-stone-950">{quantity}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQuantity(sku.id, 1)}
                        className="h-10 w-10 rounded-full bg-amber-600 text-lg font-bold text-white transition hover:bg-amber-700"
                        aria-label={`Increase ${sku.label}`}
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      {quantity > 0 ? `${formatUnitPrice(quantity * sku.unitPrice)} selected` : "Add quantity to include"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.08)] md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Frequently asked</p>
            <div className="mt-5 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <summary className="cursor-pointer list-none font-semibold text-stone-900">
                    <span className="mr-2 text-amber-600">+</span>{faq.q}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-24">
          <form id="bulk-form" onSubmit={submit} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.12)] md:p-8">
            <div className="flex items-center gap-3">
              <PackageCheck className="text-amber-700" size={22} />
              <h3 className="font-serif text-3xl text-stone-950">Request quote</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">Company details, delivery slot and order summary submit karo. Team aapko callback karegi.</p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-stone-800">
                Company / vendor name
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="Company, cafeteria or vendor name"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-stone-800">
                Phone or email
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="+91 98xxx or email"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-stone-800">
                Delivery location
                <input
                  value={deliveryLocation}
                  onChange={(event) => setDeliveryLocation(event.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="Sector, office, city, pincode"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-stone-800">
                Preferred delivery slot
                <select
                  value={deliverySlot}
                  onChange={(event) => setDeliverySlot(event.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
                >
                  {["Breakfast", "Lunch", "Evening", "Custom schedule"].map((slot) => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-stone-800">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-28 rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold leading-6 text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  placeholder="Recurring order, special mix, invoice note, timing..."
                />
              </label>
            </div>

            <div className="mt-6 rounded-[24px] border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Selected items</span>
                <span className="font-bold text-stone-900">{totalItems}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-bold text-stone-900">{formatUnitPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-stone-500">Minimum balance left</span>
                <span className={`font-bold ${meetsMinimum ? "text-emerald-700" : "text-amber-700"}`}>
                  {meetsMinimum ? "Minimum met" : `${formatUnitPrice(remaining)} more needed`}
                </span>
              </div>
              <div className="mt-4 border-t border-amber-200 pt-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Current mix</p>
                <div className="mt-3 space-y-2">
                  {items.length ? (
                    items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm text-stone-700">
                        <span>{item.label} x {item.quantity}</span>
                        <strong className="text-stone-950">{formatUnitPrice(item.total)}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">Abhi koi SKU select nahi hua.</p>
                  )}
                </div>
              </div>
            </div>

            {status ? (
              <p className={`mt-5 flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold ${sent ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                {sent ? <Check className="mt-0.5 shrink-0" size={16} /> : null}
                {status}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
              {loading ? "Sending..." : "Send bulk enquiry"}
            </button>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-stone-800 transition hover:border-amber-400 hover:text-amber-700"
            >
              <MessageCircle size={17} />
              WhatsApp quote
            </a>
            <p className="mt-4 text-center text-xs text-stone-500">Minimum order value: Rs 1000. Mixed SKUs allowed.</p>
          </form>

          <div className="rounded-[28px] bg-stone-950 p-6 text-white shadow-[0_24px_70px_rgba(28,25,23,.22)]">
            <div className="flex items-center gap-3">
              <Clock3 className="text-amber-300" size={20} />
              <h4 className="font-serif text-2xl">Built for repeat supply</h4>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Agar aap office lunches, tiffin supply ya scheduled vendor orders handle karte ho, ye module aapke recurring use-case ke liye practical entry point hai.
            </p>
            <div className="mt-5 grid gap-2 text-sm text-white/82">
              {["Custom recurring notes", "Consistent roti mix", "Business-friendly follow up"].map((item) => (
                <p key={item} className="flex items-center gap-2">
                  <BadgeCheck className="text-amber-300" size={16} /> {item}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
