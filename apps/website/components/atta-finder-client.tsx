"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

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
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[.9fr_1.1fr] md:px-10">
      <div className="rounded-2xl bg-stone-950 p-7 text-white shadow-[0_24px_70px_rgba(28,25,23,.22)]">
        <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Atta Finder</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">Choose the right pack for your family.</h1>
        <div className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-bold">
            Family size
            <input type="number" min={1} max={20} value={familySize} onChange={(event) => setFamilySize(Number(event.target.value || 1))} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Rotis per day
            <input type="number" min={1} max={200} value={rotisPerDay} onChange={(event) => setRotisPerDay(Number(event.target.value || 1))} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none" />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Preference
            <select value={preference} onChange={(event) => setPreference(event.target.value)} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none">
              <option className="text-stone-900" value="soft_rotis">Soft daily rotis</option>
              <option className="text-stone-900" value="nutrition">More nutrition</option>
              <option className="text-stone-900" value="premium">Premium wheat</option>
              <option className="text-stone-900" value="budget">Value focused</option>
              <option className="text-stone-900" value="mixed">Mixed use</option>
            </select>
          </label>
          <button onClick={runQuiz} className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-stone-950">Find My Atta</button>
          {status ? <p className="text-sm font-bold text-amber-200">{status}</p> : null}
        </div>
      </div>

      <div className="grid gap-5">
        {result ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.18em] text-amber-700">Recommendation</p>
            <h2 className="mt-3 font-serif text-3xl text-stone-950">{result.recommended_weight_kg} KG pack, {result.recommended_cycle_days}-day cycle</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Estimated monthly usage: {result.estimated_monthly_kg} KG. {result.subscription_recommended ? "A subscription is recommended for reliable freshness." : "A one-time pack is enough to start."}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-3xl text-stone-950">Your result appears here</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Answer three quick questions and WheatRaja will suggest a product, pack size and subscription rhythm.</p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {(result?.products ?? []).map((product) => {
            const image = product.images?.[0]?.url ?? "/assets/products/sharbati_atta_5kg.png";
            const weight = result?.recommended_weight_kg ?? 5;
            return (
              <article key={product.slug} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-amber-50">
                  <Image src={image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 260px" className="object-cover" />
                </Link>
                <div className="p-5">
                  <h3 className="font-serif text-2xl text-stone-950">{product.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-stone-600">{product.benefit || product.description}</p>
                  <p className="mt-3 text-sm font-black text-amber-700">{weight} KG: {formatPrice(variantPrice(product, weight))}</p>
                  <button onClick={() => addToCart({ slug: product.slug, weight, quantity: 1, subscription: Boolean(result?.subscription_recommended) })} className="mt-4 w-full rounded-xl bg-stone-950 px-4 py-3 text-sm font-black text-white">Add recommended pack</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
