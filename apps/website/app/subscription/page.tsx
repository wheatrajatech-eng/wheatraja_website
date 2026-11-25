import { Check, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SubscriptionAction } from "@/components/subscription-actions";
import { getCatalogProducts } from "@/lib/catalog";
import { PageShell } from "@/components/page-shell";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const products = await getCatalogProducts();
  const featured = products[0];

  return (
    <PageShell eyebrow="Subscribe & Save 10%" title="Monthly fresh atta subscription for any product" text="Choose product, quantity and delivery start date. Monthly billing can auto-deduct from WR Wallet, or you can keep it manual and pay when each cycle is due.">
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
          {featured ? <SubscriptionAction slug={featured.slug} products={products.map(({ slug, name, price1, price5, price10 }) => ({ slug, name, price1, price5, price10 }))} /> : null}
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
    </PageShell>
  );
}
