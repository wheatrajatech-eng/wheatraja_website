import { useState } from "react";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { useApp } from "../context";
import { PRODUCTS } from "../data";
import { ProductCard } from "../shared";

const CATEGORIES = ["All", "Multigrain", "Sharbati", "Heritage"];
const SORT_OPTIONS = ["Popular", "Price: Low to High", "Price: High to Low", "Rating"];

export function Shop() {
  const { navigate } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Popular");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = PRODUCTS
    .filter((p) =>
      (category === "All" || p.category === category) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Rating") return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    });

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <div className="bg-stone-900 text-white py-14 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Shop</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Premium Atta Collection</h1>
          <p className="text-white/55 text-sm">Freshly stone-ground after your order. NABL tested. FSSAI approved.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-10">
        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-stone-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                category === cat
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-card border border-border text-stone-600 hover:border-amber-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-muted-foreground text-sm mb-6">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={() => navigate("product", { productId: p.id })} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌾</div>
            <h3 className="font-serif font-bold text-stone-900 text-xl mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">Try a different search or category</p>
            <button onClick={() => { setSearch(""); setCategory("All"); }} className="mt-4 text-amber-600 font-semibold text-sm hover:underline">Clear filters</button>
          </div>
        )}

        {/* Subscription banner */}
        <div className="mt-16 bg-stone-900 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Subscribe &amp; Save</p>
            <h3 className="font-serif font-bold text-2xl md:text-3xl mb-2">Never run out of fresh atta</h3>
            <p className="text-white/55 text-sm">10% off every delivery. Priority shipping. Cancel anytime.</p>
          </div>
          <button
            onClick={() => navigate("home")}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Set Up Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
