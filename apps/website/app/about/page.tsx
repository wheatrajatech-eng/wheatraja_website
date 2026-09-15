import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Factory, HeartHandshake, PackageCheck, ShieldCheck, Sparkles, Truck, Wheat } from "lucide-react";

const stats = [
  ["3", "Fresh atta ranges"],
  ["1/5/10 KG", "Pack sizes"],
  ["15/30 days", "Subscription cycles"],
  ["Noida-first", "Delivery focus"]
];

const process = [
  ["Select", "Premium wheat lots are chosen for softness, aroma and daily roti performance.", Wheat],
  ["Clean", "Dust, rough impurities and uneven grains are screened before milling.", Sparkles],
  ["Mill", "Fresh chakki milling keeps the familiar texture and warm flour aroma.", Factory],
  ["Pack", "Each order is sealed with variant, pack size and traceable product details.", PackageCheck],
  ["Verify", "FSSAI and quality-proof assets are part of WheatRaja's trust layer.", BadgeCheck],
  ["Deliver", "Local routing keeps fresh atta moving quickly to Noida homes.", Truck]
];

const values = [
  ["Freshness first", "The brand is built around milling close to order time, not holding old stock for long shelf cycles."],
  ["Straightforward quality", "Clean wheat, clear pack sizes, visible proof and support that customers can actually reach."],
  ["Modern convenience", "Online ordering, wallet, subscriptions and dashboard flows make repeat buying simple."]
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FBF7ED] pt-24">
      <section className="relative overflow-hidden bg-stone-950 px-6 py-20 text-white md:py-28">
        <div className="absolute inset-0 opacity-45">
          <Image src="/assets/banners/cover7.png" alt="WheatRaja fresh flour, wheat and rotis" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/86 to-stone-950/35" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">About WheatRaja</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] md:text-7xl">Fresh atta with the honesty of a local chakki and the ease of ecommerce.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">WheatRaja serves families who want soft rotis, clean wheat, reliable delivery and a repeat ordering system that feels effortless.</p>
            <Link href="/products" className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-stone-950">
              Shop fresh atta <ArrowRight size={17} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-[24px] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
                <p className="font-serif text-4xl text-amber-300">{value}</p>
                <p className="mt-2 text-sm font-semibold text-stone-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-stone-900 shadow-[0_24px_70px_rgba(74,52,30,.16)] md:aspect-[4/3] lg:aspect-[4/5]">
          <Image src="/assets/products/sharbati_atta_10kg.png" alt="WheatRaja Sharbati atta pack" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">Our story</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 md:text-6xl">Built for homes that can taste the difference between fresh and stored atta.</h2>
          <p className="mt-6 text-lg leading-8 text-stone-600">Mass packaged atta is optimized for scale, warehousing and long shelf presence. WheatRaja is designed around a tighter local loop: selected grain, fresh milling, clean packing and fast delivery.</p>
          <p className="mt-4 text-lg leading-8 text-stone-600">The goal is simple: make premium chakki atta feel as easy to buy as any modern online grocery product, while keeping the freshness promise visible.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["No maida or preservatives", "FSSAI quality trust", "Wallet and subscription ready", "Local Noida support"].map((item) => (
              <p key={item} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-stone-800 shadow-sm">
                <Check className="text-amber-700" size={17} /> {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">How it works</p>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">Every step is designed to answer one question: why should a family trust this atta?</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {process.map(([title, text, Icon], index) => (
              <div key={String(title)} className="rounded-[28px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.1]">
                <div className="flex items-center justify-between">
                  <Icon className="text-amber-300" size={30} />
                  <span className="font-serif text-3xl text-white/20">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-2xl font-black">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-300">{String(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1fr_.9fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">What we stand for</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 md:text-6xl">Premium does not need to feel complicated.</h2>
          <p className="mt-5 text-lg leading-8 text-stone-600">WheatRaja keeps the product line focused, the pack choices clear and the subscription system practical for monthly homes.</p>
        </div>
        <div className="space-y-4">
          {values.map(([title, text]) => (
            <div key={title} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(74,52,30,.1)]">
              <HeartHandshake className="text-amber-700" size={24} />
              <h3 className="mt-4 font-serif text-3xl text-stone-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">Quality proof</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 md:text-6xl">Trust badges are visible because food trust should not be hidden.</h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">FSSAI and quality certification assets are presented clearly across the customer journey, alongside product details, reviews and support access.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[28px] border border-stone-200 bg-[#FBF7ED] p-5 text-center shadow-sm">
              <Image src="/assets/trust/WR_FSSAI.png" alt="WheatRaja FSSAI approved badge" width={260} height={260} className="mx-auto h-52 w-52 rounded-full object-cover" />
              <p className="mt-4 font-bold text-stone-950">FSSAI approved</p>
            </div>
            <div className="rounded-[28px] border border-stone-200 bg-[#FBF7ED] p-5 text-center shadow-sm">
              <Image src="/assets/trust/WR_NABL.png" alt="WheatRaja NABL certified quality badge" width={260} height={260} className="mx-auto h-52 w-52 rounded-full object-cover" />
              <p className="mt-4 font-bold text-stone-950">NABL certified promise</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[32px] bg-stone-950 p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <ShieldCheck className="text-amber-300" size={30} />
            <h2 className="mt-4 font-serif text-4xl">Ready for fresher rotis?</h2>
            <p className="mt-3 max-w-2xl text-stone-300">Choose a product, pick 1 KG, 5 KG or 10 KG, and reorder or subscribe from the same account.</p>
          </div>
          <Link href="/products" className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-stone-950">
            Explore products <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
