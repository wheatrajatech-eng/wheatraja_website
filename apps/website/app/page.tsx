import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Check, Clock, Heart, Leaf, Package, RefreshCw, Shield, Truck, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getCatalogBanners, getCatalogProducts } from "@/lib/catalog";
import { reviews, trustProofs } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

const features = [
  { icon: Zap, title: "Freshly Milled After Order", desc: "Never pre-ground. Never stored. Milled when your order comes in." },
  { icon: Award, title: "Premium Wheat Selection", desc: "Selected Sharbati, Sehori and multigrain blends for daily rotis." },
  { icon: Package, title: "Stone Ground Process", desc: "Traditional chakki-style grinding helps retain bran, germ and aroma." },
  { icon: Leaf, title: "Nutrient Rich", desc: "Fresh flour with natural fibre, minerals and whole wheat goodness." },
  { icon: Heart, title: "Soft Rotis Every Time", desc: "Fresh milling keeps texture and aroma visibly better." },
  { icon: Check, title: "Better Daily Freshness", desc: "Batch labels and quick dispatch make freshness easier to trust." },
  { icon: Shield, title: "No Preservatives", desc: "No maida, no artificial additives, no shortcuts." },
  { icon: Truck, title: "Doorstep Delivery", desc: "Delivery across Noida and nearby service areas." }
];

export default async function HomePage() {
  const products = await getCatalogProducts();
  const banners = await getCatalogBanners();
  const heroBanner = banners[0];
  const subscriptionProduct = products[0];

  return (
    <main className="min-h-screen bg-[#FAF7EF]">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950">
        <video className="absolute inset-0 h-full w-full object-cover opacity-55" autoPlay muted loop playsInline poster="/assets/banners/cover7.png">
          <source src="/assets/banners/wheat-field.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/75" />
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-16 pt-24 text-center md:px-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" />
            Freshly Milled After Every Order
          </div>
          <h1 className="mb-7 font-serif text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-7xl md:text-8xl">{heroBanner?.title ?? <>Freshly Milled<br /><em className="not-italic text-amber-400">Atta.</em> Delivered<br />Fresh. Every Time.</>}</h1>
          <p className="mx-auto mb-11 max-w-2xl text-lg font-light leading-relaxed text-white/75 md:text-xl">
            {heroBanner?.subtitle ?? "Premium chakki fresh atta made after you order. Never stale, never shelf-first, nutritious in every roti."}
          </p>
          <div className="mb-14 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={heroBanner?.link_url ?? "/products"} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-9 py-4 text-base font-bold text-stone-950 shadow-xl shadow-amber-600/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400">
              {heroBanner?.cta_text ?? "Shop Now"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/subscription" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-9 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              Subscribe & Save 10%
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[["FSSAI Approved", BadgeCheck], ["NABL Certified", Award], ["Freshly Milled", Zap], ["Home Delivery", Truck]].map(([label, Icon]) => (
              <div key={String(label)} className="flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                <Icon className="h-4 w-4 text-amber-400" />{String(label)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAF7EF] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Our Collection</p>
            <h2 className="mb-4 font-serif text-4xl font-bold text-stone-900 md:text-5xl">Premium Atta Range</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-stone-500">Every variety stone-ground fresh, packed with nutrition, delivered to your door.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {products.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
          <div className="mt-10 text-center">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-full border-2 border-amber-600 px-8 py-3 font-semibold text-amber-700 transition-all hover:bg-amber-600 hover:text-white">
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-stone-900 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-16 grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">The Difference</p>
              <h2 className="mb-5 font-serif text-4xl font-bold leading-tight md:text-5xl">Why Wheat Raja Stands Apart</h2>
              <p className="text-base leading-relaxed text-white/55">Families switch because fresh atta tastes different, cooks softer, and feels more trustworthy.</p>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-stone-800">
              <Image src="/assets/banners/cover7.png" alt="Fresh wheat and atta" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-80" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-amber-500/30 hover:bg-amber-500/10 md:p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 transition-colors group-hover:bg-amber-500/30">
                  <Icon className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold leading-snug text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-white/45">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAF7EF] py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:gap-16 md:px-10">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Subscribe & Save</p>
            <h2 className="mb-5 font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl">Never Run Out Of Fresh Atta</h2>
            <p className="mb-9 leading-relaxed text-stone-500">Set it, forget it, savour it. Your freshly milled atta arrives on schedule every time.</p>
            <div className="space-y-4">
              {[
                ["10% Discount", "On every subscription delivery"],
                ["Priority Delivery", "Subscribers move faster in the milling queue"],
                ["Auto Refill", "No manual reorder needed"],
                ["Flexible Schedule", "Pause, skip or cancel anytime"]
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
                  <Link key={product.slug} href={`/subscription?product=${product.slug}`} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${subscriptionProduct?.slug === product.slug ? "border-amber-500 bg-amber-50 text-amber-900" : "border-stone-200 text-stone-700 hover:border-amber-300"}`}>
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
                  <Link key={label} href="/subscription" className={`rounded-xl border py-2.5 text-center text-xs font-semibold transition-all ${index === 0 ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 text-stone-600 hover:border-amber-300"}`}>{label}</Link>
                ))}
              </div>
            </div>
            <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm">
              <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Product</span><span className="font-medium text-stone-900">{subscriptionProduct?.name ?? "Fresh atta"}</span></div>
              <div className="mb-1.5 flex justify-between"><span className="text-stone-500">Frequency</span><span className="font-medium text-stone-900">Every 15 or 30 days</span></div>
              <div className="mt-3 flex justify-between border-t border-amber-200 pt-3">
                <span className="font-bold text-stone-800">You Pay</span>
                <div><span className="text-lg font-bold text-amber-700">{formatPrice(Math.round((subscriptionProduct?.price5 ?? 390) * 0.9))}</span><span className="ml-1 text-xs text-stone-400">/ delivery</span></div>
              </div>
            </div>
            <Link href="/subscription" className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-amber-700">
              <RefreshCw className="h-4 w-4" /> Subscribe Now
            </Link>
            <p className="mt-3 text-center text-xs text-stone-500">Cancel or pause anytime. No hidden charges.</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Corporate ordering</p>
            <h2 className="font-serif text-4xl font-bold text-stone-900 md:text-5xl">Bulk chapati supply for offices and vendors</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-500">
              Need roti supply for office lunch, a cafeteria, or a vendor-led food program? Explore our new bulk module built around freshness, volume and simple follow-up.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["MOQ Rs 1000", "Start with a mixed SKU basket or a single roti type."],
              ["Fresh batch supply", "Prepared after order and coordinated for the right delivery slot."],
              ["Made for B2B", "Corporate kitchens, tiffin vendors and managed cafeterias."]
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
                <p className="font-serif text-2xl text-stone-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[28px] bg-stone-950 px-6 py-6 text-white md:flex-row md:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">New page</p>
              <h3 className="mt-2 font-serif text-2xl md:text-3xl">Bulk chapati ordering module is now live.</h3>
            </div>
            <Link href="/bulk-order" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-bold text-stone-950 transition hover:bg-amber-400">
              Explore bulk order <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-amber-600 py-16 text-center md:py-20">
        <div className="mx-auto max-w-5xl px-5 md:px-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
            <Clock className="h-3 w-3" /> Limited Time Offer
          </div>
          <h2 className="mb-3 font-serif text-3xl font-bold text-white md:text-5xl">5% Off Your Fresh Order</h2>
          <p className="mb-8 text-sm text-white/80">Use code <span className="rounded-md bg-white/20 px-2.5 py-0.5 font-bold tracking-wider text-white">SAVE05</span> at checkout.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["First Order Offer", "Fresh discount on your first Wheat Raja order", "SAVE05", "Any order"],
              ["Free 1 KG Multigrain", "Complimentary bag on eligible family orders", "FREE1KG", "Above Rs 999"],
              ["Subscription Saver", "Extra value when you subscribe today", "SUBSAVE", "15 or 30 days"]
            ].map(([title, desc, code, note]) => (
              <div key={title} className="rounded-2xl border border-white/20 bg-white/12 p-5 text-left backdrop-blur-sm">
                <h3 className="font-serif text-xl font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm text-white/70">{desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold tracking-wider text-amber-700">{code}</span>
                  <span className="text-xs text-white/55">{note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Trust engine</p>
            <h2 className="font-serif text-4xl font-bold text-stone-900 md:text-5xl">Proof on every step. Not just promises.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {trustProofs.map((proof, index) => (
              <div key={proof.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                {index < 2 ? (
                  <Image src={index === 0 ? "/assets/trust/WR_FSSAI.png" : "/assets/trust/WR_NABL.png"} alt={proof.title} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <BadgeCheck className="text-green-700" size={26} />
                )}
                <p className="mt-5 font-serif text-2xl text-stone-900">{proof.title}</p>
                <p className="mt-3 text-sm leading-6 text-stone-500">{proof.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAF7EF] py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-10">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">Verified families</p>
            <h2 className="font-serif text-4xl font-bold text-stone-900 md:text-5xl">Social proof that feels local and fresh.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <figure key={review.name} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-lg text-amber-500">★★★★★</p>
                <blockquote className="mt-4 text-lg leading-7 text-stone-700">"{review.text}"</blockquote>
                <figcaption className="mt-5 text-sm font-black text-stone-900">{review.name}</figcaption>
                <p className="mt-1 text-xs font-bold uppercase tracking-[.14em] text-green-700">Verified purchase / {review.product}</p>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 px-6 py-20 text-center text-white">
        <h2 className="mx-auto max-w-3xl font-serif text-4xl md:text-6xl">Order atta that feels freshly made, not shelf-stored.</h2>
        <p className="mx-auto mt-5 max-w-xl text-white/72">Choose your wheat, check your area, and let Wheat Raja mill it fresh.</p>
        <div className="mt-8 flex justify-center">
          <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-9 py-4 text-base font-bold text-stone-950 transition hover:bg-amber-400">
            Shop Wheat Raja <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
