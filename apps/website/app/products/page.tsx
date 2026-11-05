import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/catalog";
import { PageShell } from "@/components/page-shell";

const categories = ["All", "Multigrain", "Sharbati", "Sehori"];

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const params = await searchParams;
  const products = await getCatalogProducts();
  const query = (params?.q ?? "").trim().toLowerCase();
  const category = params?.category ?? "All";
  const sort = params?.sort ?? "Popular";
  const filteredProducts = products
    .filter((product) => {
      const haystack = [product.name, product.subtitle, product.benefit, product.ingredients].join(" ").toLowerCase();
      const categoryMatch = category === "All" || haystack.includes(category.toLowerCase());
      return categoryMatch && (!query || haystack.includes(query));
    })
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price1 - b.price1;
      if (sort === "Price: High to Low") return b.price1 - a.price1;
      return a.name.localeCompare(b.name);
    });

  return (
    <PageShell eyebrow="Shop" title="Premium Atta Collection" text="Freshly stone-ground after your order. NABL tested. FSSAI approved.">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <img src="/assets/banners/flour-chakki-still-life.webp" alt="" className="h-full w-full object-cover" />
        </div>
      <section className="relative mx-auto max-w-7xl px-5 py-10 md:px-10">
        <form className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              name="q"
              defaultValue={params?.q ?? ""}
              placeholder="Search Sharbati, Multigrain, 10 KG plans..."
              className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-sm transition-colors focus:border-amber-400 focus:outline-none"
            />
          </div>
          <select name="sort" defaultValue={sort} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 focus:border-amber-400 focus:outline-none">
            {["Popular", "Price: Low to High", "Price: High to Low"].map((option) => <option key={option}>{option}</option>)}
          </select>
          <button className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-700">Search</button>
        </form>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((item) => (
            <Link
              key={item}
              href={`/products${item === "All" ? "" : `?category=${encodeURIComponent(item)}`}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${category === item ? "bg-amber-600 text-white shadow-sm" : "border border-stone-200 bg-white text-stone-600 hover:border-amber-300"}`}
            >
              {item}
            </Link>
          ))}
        </div>

        <section className="relative mb-12 overflow-hidden rounded-[32px] border border-[#e8dcc8] bg-[#fffdf7]/88 shadow-[0_22px_70px_rgba(104,65,42,.12)] backdrop-blur-md">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf7]/96 via-[#fffdf7]/84 to-[#f7eedc]/35" />
          <div className="relative grid items-center gap-6 px-6 py-7 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-9">
            <div className="relative mx-auto h-56 w-full max-w-xs md:h-64">
              <img src="/assets/products/multigrain_atta_5kg.webp" alt="Wheat Raja Super Multigrain Atta pack" className="h-full w-full object-contain drop-shadow-[0_20px_24px_rgba(59,36,24,.22)]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a9600f]">Packaging with a purpose</p>
              <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight text-[#3b2418] md:text-5xl">Freshness you can see before you taste.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#68412a]/75">Clear variant labels, honest grain details and a premium pack experience for the atta that belongs in your everyday kitchen.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#68412a]">
                {['Stone-ground fresh', 'Clean grain blend', 'Traceable batch detail'].map((item) => <span key={item} className="rounded-full border border-[#e8dcc8] bg-white/75 px-3 py-2">{item}</span>)}
              </div>
            </div>
          </div>
        </section>

        <p className="mb-6 text-sm text-stone-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found</p>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {filteredProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h3 className="mb-2 font-serif text-xl font-bold text-stone-900">No products found</h3>
            <p className="text-sm text-stone-500">Try a different search or category.</p>
            <Link href="/products" className="mt-4 inline-flex text-sm font-semibold text-amber-600 hover:underline">Clear filters</Link>
          </div>
        )}

        <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl bg-stone-900 p-8 text-white md:flex-row md:p-12">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Subscribe & Save</p>
            <h3 className="mb-2 font-serif text-2xl font-bold md:text-3xl">Never run out of fresh atta</h3>
            <p className="text-sm text-white/55">10% off every delivery. Wallet auto-deduct. Cancel anytime.</p>
          </div>
          <Link href="/subscription" className="shrink-0 rounded-full bg-amber-500 px-8 py-3.5 font-bold text-stone-950 transition-colors hover:bg-amber-400">
            Set Up Subscription
          </Link>
        </div>
      </section>
      </div>
    </PageShell>
  );
}
