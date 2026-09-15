import Link from "next/link";
import { Check, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SubscriptionAction } from "@/components/subscription-actions";
import { getCatalogProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const products = await getCatalogProducts();
  const featured = products[0];

  return (
    <main className="min-h-screen bg-[#FAF7EF] pt-16">
      <section className="bg-stone-900 px-5 py-14 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Subscribe & Save 10%</p>
          <h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl">Monthly fresh atta subscription for any product</h1>
          <p className="max-w-2xl text-sm leading-6 text-white/55">Choose product, quantity and delivery start date. Monthly billing can auto-deduct from WR Wallet, or you can keep it manual and pay when each cycle is due.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-10">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Modern grocery-style subscription</p>
          <h2 className="mb-5 font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl">Never run out of fresh atta</h2>
          <p className="mb-9 leading-relaxed text-stone-500">Your chosen pack is milled fresh each cycle, billed from wallet when possible, and shown in your dashboard with next delivery plus reminder status.</p>
          <div className="space-y-4">
            {[
              ["15-day and 30-day plans", "Perfect for small and family kitchens"],
              ["Wallet auto-deduct", "Recommended for uninterrupted monthly billing"],
              ["Payment due state", "If wallet is low, the cycle stays payable until cleared"],
              ["Auto reminder", "System will remind you before the next refill window"],
              ["Pause or skip", "Control deliveries without calling support"]
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3.5">
                <Check className="mt-0.5 h-5 w-5 text-amber-600" />
                <div><span className="text-sm font-semibold text-stone-900">{title}</span><span className="text-sm text-stone-500"> - {desc}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="mb-6 font-serif text-xl font-bold text-stone-900">Configure Your Plan</h3>
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Select Product</p>
            <div className="space-y-2">
              {products.map((product) => (
                <Link key={product.slug} href={`/products/${product.slug}`} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${featured?.slug === product.slug ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-700 hover:border-amber-300"}`}>
                  <span className="font-medium">{product.name} - 5 KG</span>
                  <span className="font-bold">{formatPrice(Math.round(product.price5 * 0.9))}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">Delivery Plan</p>
            <div className="grid grid-cols-2 gap-2">
              {["15 Days", "30 Days"].map((label, index) => (
                <div key={label} className={`rounded-xl border py-2.5 text-center text-xs font-semibold ${index === 0 ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 text-stone-600"}`}>{label}</div>
              ))}
            </div>
          </div>
          <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
            <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Product</span><span className="font-medium text-stone-900">{featured?.name ?? "Fresh atta"}</span></div>
            <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Plan</span><span className="font-medium text-stone-900">15 or 30 days</span></div>
            <div className="mt-3 flex justify-between border-t border-amber-200 pt-3">
              <span className="font-bold text-stone-800">You Pay</span>
              <div><span className="text-lg font-bold text-amber-700">{formatPrice(Math.round((featured?.price5 ?? 390) * 0.9))}</span><span className="ml-1 text-xs text-stone-400">/ delivery</span></div>
            </div>
          </div>
          {featured ? <SubscriptionAction slug={featured.slug} /> : null}
          <p className="mt-3 text-center text-xs text-stone-500">Cancel or pause anytime. No hidden charges.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Pick your atta</p>
          <h2 className="font-serif text-4xl font-bold text-stone-900">Subscription-ready packs</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
    </main>
  );
}
