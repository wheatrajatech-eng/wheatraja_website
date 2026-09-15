import Link from "next/link";
import { ArrowRight, Factory, ShieldCheck, Truck, Wheat } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { BulkOrderClient } from "@/components/bulk-order-client";

export const metadata = {
  title: "Bulk Chapati Ordering",
  description: "Corporate fooding, office lunch and vendor supply ke liye bulk chapati ordering module. Minimum order value Rs 1000."
};

export default function BulkOrderPage() {
  return (
    <PageShell
      eyebrow="Corporate fooding"
      title="Bulk chapati ordering for offices, vendors and managed kitchens."
      text="Minimum order value Rs 1000. Fresh rotis, mixed SKU supply, and a simple inquiry flow for recurring corporate meals."
    >
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Wheat, title: "Fresh after order", text: "Every bulk batch is prepared against real enquiry, not shelf stock." },
            { icon: Factory, title: "Business ready", text: "Suitable for office lunch, cafeterias, tiffin vendors and food partners." },
            { icon: Truck, title: "Delivery coordination", text: "Share slot and location; team confirms the feasible delivery plan." }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                  <Icon size={20} />
                </div>
                <p className="mt-4 font-serif text-2xl text-stone-950">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <BulkOrderClient />

      <section className="bg-white px-5 py-16 md:px-10">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-stone-950 p-8 text-white md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Need a custom business flow?</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">We can shape this into a recurring office lunch or vendor supply workflow.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                If you want weekly ordering, invoice handling, or a dedicated corporate onboarding section, this page is a clean base to expand from.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 font-bold text-stone-950 transition hover:bg-amber-400">
                Talk to team <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="https://wa.me/919876543210" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-6 py-3.5 font-semibold text-white transition hover:bg-white/12">
                WhatsApp corporate inquiry
              </Link>
              <p className="text-xs text-white/55">Fresh rotis. Clear minimums. Simple follow-up.</p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
