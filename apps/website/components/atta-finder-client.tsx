"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

const apiBase = typeof window !== "undefined" ? "/api/v1" : process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type ApiProduct = {
  slug: string;
  name: string;
  description: string;
  benefit?: string | null;
  variants: { weight_kg: 1 | 5 | 10; price: number }[];
  images?: { url: string; alt: string }[];
};

type QuizResult = {
  estimated_monthly_kg: number;
  recommended_weight_kg: 1 | 5 | 10;
  recommended_cycle_days: number;
  subscription_recommended: boolean;
  products: ApiProduct[];
};

export function AttaFinderClient() {
  const [familySize, setFamilySize] = useState(4);
  const [rotisPerDay, setRotisPerDay] = useState(12);
  const [preference, setPreference] = useState("soft_rotis");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [status, setStatus] = useState("");

  async function runQuiz() {
    setStatus("Finding your atta match...");
    try {
      const response = await fetch(`${apiBase}/growth/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_size: familySize, rotis_per_day: rotisPerDay, preference, delivery_cycle_days: 30 })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "Could not run finder");
      setResult(payload);
      setStatus("Recommendation ready.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not run finder.");
    }
  }

  function variantPrice(product: ApiProduct, weight: number) {
    return product.variants.find((variant) => variant.weight_kg === weight)?.price ?? product.variants[0]?.price ?? 0;
  }

  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#fffdf7] px-5 py-12 md:px-10 md:py-20">
      <div className="pointer-events-none fixed inset-0 z-[1]">
        <Image src="/assets/banners/atta-finder-family.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c98218]/30 bg-[#fffdf7] px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-[#a9600f] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#c98218]" /> Personal atta concierge
            </div>
            <h1 className="font-serif text-5xl leading-[.98] tracking-tight text-[#3b2418] md:text-7xl">Your perfect atta,<br /><em className="not-italic text-[#c98218]">thoughtfully chosen.</em></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#68412a]/75 md:text-lg">Tell us how your home eats. We will match your family with the right grain, pack size and delivery rhythm.</p>
          </div>
          <div className="hidden rounded-[24px] border border-[#e8dcc8] bg-[#fffdf7] px-5 py-4 text-right shadow-sm md:block">
            <p className="font-serif text-3xl text-[#a9600f]">03</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[.16em] text-[#68412a]/65">Simple questions</p>
          </div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[.78fr_1.22fr]">
          <div className="rounded-[32px] border border-[#e8dcc8] bg-[#fffdf7] p-6 shadow-[0_24px_80px_rgba(104,65,42,.12)] md:p-8">
            <div className="mb-7 flex items-center gap-3">
              {["01", "02", "03"].map((step, index) => <div key={step} className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-black ${index === 0 ? "bg-[#c98218] text-white" : "bg-[#f7eedc] text-[#a9600f]"}`}>{step}</span>{index < 2 ? <span className="h-px w-8 bg-[#e8dcc8]" /> : null}</div>)}
            </div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#a9600f]">Start with your household</p>
            <h2 className="mt-2 font-serif text-3xl text-[#3b2418]">A better match starts here.</h2>
            <div className="mt-7 grid gap-5">
              <label className="grid gap-2 text-sm font-bold text-[#3b2418]">Family size <span className="text-xs font-normal text-[#68412a]/60">How many people eat at home?</span>
                <input aria-label="Family size" type="number" min={1} max={20} value={familySize} onChange={(event) => setFamilySize(Number(event.target.value || 1))} className="h-14 rounded-2xl border border-[#e8dcc8] bg-white px-4 text-[#3b2418] outline-none transition focus:border-[#c98218] focus:ring-4 focus:ring-[#c98218]/10" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#3b2418]">Rotis per day <span className="text-xs font-normal text-[#68412a]/60">Your approximate daily routine</span>
                <input aria-label="Rotis per day" type="number" min={1} max={200} value={rotisPerDay} onChange={(event) => setRotisPerDay(Number(event.target.value || 1))} className="h-14 rounded-2xl border border-[#e8dcc8] bg-white px-4 text-[#3b2418] outline-none transition focus:border-[#c98218] focus:ring-4 focus:ring-[#c98218]/10" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#3b2418]">What matters most? <span className="text-xs font-normal text-[#68412a]/60">Choose your everyday priority</span>
                <select aria-label="Atta preference" value={preference} onChange={(event) => setPreference(event.target.value)} className="h-14 rounded-2xl border border-[#e8dcc8] bg-white px-4 text-[#3b2418] outline-none transition focus:border-[#c98218] focus:ring-4 focus:ring-[#c98218]/10">
                  <option value="soft_rotis">Soft daily rotis</option><option value="nutrition">More nutrition</option><option value="premium">Premium wheat</option><option value="budget">Value focused</option><option value="mixed">Mixed use</option>
                </select>
              </label>
              <button onClick={runQuiz} className="mt-2 inline-flex h-14 items-center justify-center rounded-full bg-[#c98218] px-5 text-sm font-black text-white shadow-lg shadow-[#a9600f]/20 transition hover:-translate-y-0.5 hover:bg-[#a9600f]">Find my perfect atta <span className="ml-2 text-lg">→</span></button>
              {status ? <p role="status" className="text-sm font-bold text-[#a9600f]">{status}</p> : null}
            </div>
          </div>

          <div className="grid gap-5">
            {result ? (
              <div className="rounded-[32px] border border-[#c98218]/30 bg-[#3b2418] p-7 text-white shadow-[0_24px_80px_rgba(59,36,24,.2)] md:p-8">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#e7b95e]">Your considered match</p><h2 className="mt-3 font-serif text-3xl md:text-4xl">{result.recommended_weight_kg} KG pack · {result.recommended_cycle_days}-day rhythm</h2></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#e7b95e]">Ready</span></div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">Estimated monthly usage: {result.estimated_monthly_kg} KG. {result.subscription_recommended ? "A subscription will keep your fresh-milled routine effortless." : "A one-time pack is a great place to start."}</p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[32px] border border-[#e8dcc8] bg-[#fffdf7] p-7 shadow-[0_20px_60px_rgba(104,65,42,.09)] md:p-8">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#e7b95e]/20 blur-2xl" />
                <p className="relative text-xs font-black uppercase tracking-[.18em] text-[#a9600f]">Your result appears here</p>
                <h2 className="relative mt-3 max-w-xl font-serif text-3xl text-[#3b2418] md:text-4xl">A calmer way to choose your daily flour.</h2>
                <p className="relative mt-3 max-w-xl text-sm leading-7 text-[#68412a]/70">Answer three quick questions and we will suggest a product, pack size and subscription rhythm made around your household.</p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {(result?.products ?? []).map((product) => {
                const image = product.images?.[0]?.url ?? "/assets/products/sharbati_atta_5kg.webp";
                const weight = result?.recommended_weight_kg ?? 5;
                return (
                  <article key={product.slug} className="overflow-hidden rounded-[26px] border border-[#e8dcc8] bg-[#fffdf7] shadow-[0_18px_52px_rgba(104,65,42,.10)]">
                    <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-[#f7eedc] p-3"><Image src={image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 260px" className="object-contain p-3" /></Link>
                    <div className="p-5"><h3 className="font-serif text-2xl text-[#3b2418]">{product.name}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-[#68412a]/70">{product.benefit || product.description}</p><p className="mt-3 text-sm font-black text-[#a9600f]">{weight} KG · {formatPrice(variantPrice(product, weight))}</p><button onClick={() => addToCart({ slug: product.slug, weight, quantity: 1, subscription: Boolean(result?.subscription_recommended) })} className="mt-4 w-full rounded-full bg-[#3b2418] px-4 py-3 text-sm font-black text-white transition hover:bg-[#68412a]">Add recommended pack</button></div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
