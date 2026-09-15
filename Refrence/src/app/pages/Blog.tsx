import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, User, Tag, Search, Mail, ChevronRight } from "lucide-react";
import { useApp } from "../context";
import { BLOG_POSTS, BLOG_CATEGORIES } from "../data";

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.45, ease: "easeOut" } };

export function Blog() {
  const { navigate, selectedBlogId } = useApp();
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState(selectedBlogId);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const openArticle = (id: number) => {
    setDetailId(id);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    return BLOG_POSTS.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  const article = BLOG_POSTS.find((p) => p.id === detailId) ?? BLOG_POSTS[0];
  const related = BLOG_POSTS.filter((p) => p.id !== article.id && (p.category === article.category || p.tags.some((t) => article.tags.includes(t)))).slice(0, 3);

  if (view === "detail") {
    return (
      <div className="min-h-screen bg-background pt-16">
        {/* Hero image */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto px-5 md:px-10 -mt-20 relative z-10 pb-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/70 mb-4">
            <button onClick={() => setView("list")} className="hover:text-white transition-colors">Blog</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/50">{article.category}</span>
          </div>

          {/* Article card */}
          <div className="bg-card border border-border rounded-2xl p-7 md:p-10 shadow-xl">
            <div className="mb-5">
              <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4">{article.category}</span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-4">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{article.author}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{article.readTime}</span>
                <span>{article.date}</span>
              </div>
            </div>

            <p className="text-stone-700 text-sm leading-relaxed mb-6 border-l-4 border-amber-400 pl-4 italic">{article.excerpt}</p>

            <div className="prose prose-sm max-w-none text-stone-700 leading-relaxed">
              {article.content.split(". ").reduce<string[][]>((acc, sentence, i) => {
                const group = Math.floor(i / 4);
                if (!acc[group]) acc[group] = [];
                acc[group].push(sentence);
                return acc;
              }, []).map((group, i) => (
                <p key={i} className="mb-4 text-sm leading-7">{group.join(". ")}.</p>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-border">
              {article.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-stone-100 text-stone-600 text-xs px-3 py-1.5 rounded-full">
                  <Tag className="w-3 h-3" />{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => setView("list")}
            className="mt-6 inline-flex items-center gap-2 text-amber-700 font-semibold text-sm hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all articles
          </button>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-5">Related Articles</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {related.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openArticle(r.id)}
                    className="text-left bg-card border border-border rounded-xl overflow-hidden hover:border-amber-300 transition-colors group"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{r.category}</span>
                      <p className="font-semibold text-stone-900 text-sm mt-1 leading-snug line-clamp-2">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.readTime}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-7 text-center">
            <Mail className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Never Miss a Health Insight</h3>
            <p className="text-stone-600 text-sm mb-5">Get our weekly nutrition tips and recipes delivered to your inbox.</p>
            {subscribed ? (
              <p className="text-green-700 font-semibold text-sm">You're subscribed! Thank you.</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white border border-amber-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors">Subscribe</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
      <section className="bg-stone-900 py-20 px-5 md:px-10 text-center">
        <motion.div {...fade}>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Wheat Raja Journal</p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">Nourish Your Mind</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Science-backed nutrition insights, traditional recipes, and the latest in whole grain health — written by experts who care.</p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-12">
        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-full text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? "bg-amber-600 text-white" : "bg-card border border-border text-stone-600 hover:border-amber-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured article */}
        {filtered.length > 0 && (
          <motion.div {...fade} className="mb-10">
            <button
              onClick={() => openArticle(filtered[0].id)}
              className="w-full text-left group grid md:grid-cols-2 gap-0 bg-card border border-border rounded-2xl overflow-hidden hover:border-amber-300 transition-colors"
            >
              <div className="aspect-video md:aspect-auto overflow-hidden">
                <img src={filtered[0].image} alt={filtered[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-7 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{filtered[0].category}</span>
                  <span className="text-xs text-muted-foreground">{filtered[0].readTime}</span>
                </div>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-3 leading-tight group-hover:text-amber-700 transition-colors">{filtered[0].title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{filtered[0].excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{filtered[0].author}</span>
                  <span>·</span>
                  <span>{filtered[0].date}</span>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Grid */}
        {filtered.length > 1 && (
          <div className="grid md:grid-cols-3 gap-5">
            {filtered.slice(1).map((post, i) => (
              <motion.button
                key={post.id}
                onClick={() => openArticle(post.id)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
                className="text-left bg-card border border-border rounded-2xl overflow-hidden hover:border-amber-300 transition-colors group"
              >
                <div className="aspect-video overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{post.category}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{post.readTime}</span>
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 text-base mb-2 leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-semibold mb-2">No articles found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}

        {/* Newsletter banner */}
        <motion.div
          {...fade}
          className="mt-14 bg-stone-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Stay nourished. Stay informed.</h3>
            <p className="text-white/60 text-sm">Weekly nutrition insights from our expert team. No spam, ever.</p>
          </div>
          <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 md:w-64 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
            />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors whitespace-nowrap">Subscribe</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
