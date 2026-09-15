import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getCatalogProducts } from "@/lib/catalog";

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
    <main className="min-h-screen bg-[#FAF7EF] pt-16">
      <section className="bg-stone-900 px-5 py-14 text-white md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">Shop</p>
          <h1 className="mb-4 font-serif text-4xl font-bold md:text-5xl">Premium Atta Collection</h1>
          <p className="text-sm text-white/55">Freshly stone-ground after your order. NABL tested. FSSAI approved.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-10">
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
    </main>
  );
}
