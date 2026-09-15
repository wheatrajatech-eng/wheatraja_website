import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper, Search, Sparkles } from "lucide-react";
import { getCatalogBlogs } from "@/lib/catalog";

const categories = ["All", "Blog", "News", "Article"];

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; category?: string; tag?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();
  const activeCategory = categories.includes(params.category ?? "") ? params.category ?? "All" : "All";
  const activeTag = params.tag ?? "";
  const blogPosts = await getCatalogBlogs();
  const filtered = blogPosts.filter((post) => {
    const categoryMatch = activeCategory === "All" || post.category === activeCategory;
    const tagMatch = !activeTag || post.tags?.some((tag) => tag.toLowerCase() === activeTag.toLowerCase());
    const text = `${post.title} ${post.excerpt} ${post.category} ${(post.tags ?? []).join(" ")}`.toLowerCase();
    return categoryMatch && tagMatch && (!query || text.includes(query));
  });
  const featured = blogPosts[0];
  const tags = Array.from(new Set(blogPosts.flatMap((post) => post.tags ?? []))).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#FBF7ED] pt-24">
      <section className="relative overflow-hidden bg-stone-950 px-6 py-20 text-white md:py-28">
        <div className="absolute inset-0 opacity-35">
          <Image src="/assets/banners/cover7.png" alt="Fresh wheat flour journal background" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/88 to-stone-950/35" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Freshness journal</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] md:text-7xl">Blogs, news and articles for better everyday atta.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">Read practical wheat guides, fresh atta storage notes, WheatRaja updates and family nutrition articles.</p>
          </div>
          <form action="/blog" className="rounded-[28px] border border-white/12 bg-white/10 p-4 backdrop-blur-xl">
            <label className="flex items-center gap-3 rounded-full bg-white px-5 py-4 text-stone-950">
              <Search className="text-amber-700" size={20} />
              <input name="q" defaultValue={params.q ?? ""} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Search wheat, atta, storage..." />
            </label>
            {activeCategory !== "All" ? <input type="hidden" name="category" value={activeCategory} /> : null}
            <button className="mt-3 w-full rounded-full bg-amber-400 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-stone-950">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-7xl gap-4 px-6 pb-12 md:grid-cols-4">
        {categories.map((category) => {
          const href = category === "All" ? "/blog" : `/blog?category=${category}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          const active = category === activeCategory;
          return (
            <Link key={category} href={href} className={`rounded-[24px] border p-5 text-center font-black transition ${active ? "border-amber-400 bg-stone-950 text-white shadow-[0_18px_50px_rgba(28,25,23,.2)]" : "border-stone-200 bg-white text-stone-950 shadow-sm hover:-translate-y-1"}`}>
              {category}
            </Link>
          );
        })}
      </section>

      {tags.length ? (
        <section className="mx-auto flex max-w-7xl flex-wrap gap-3 px-6 pb-12">
          {tags.map((tag) => (
            <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={`rounded-full border px-4 py-2 text-sm font-black ${activeTag === tag ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-700"}`}>
              #{tag}
            </Link>
          ))}
        </section>
      ) : null}

      {featured ? (
        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 lg:grid-cols-[1.2fr_.8fr] lg:items-stretch">
          <Link href={`/blog/${featured.slug}`} className="group relative min-h-[430px] overflow-hidden rounded-[32px] shadow-[0_24px_70px_rgba(74,52,30,.16)]">
            <Image src={featured.hero} alt={featured.title} fill sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white md:p-8">
              <span className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-stone-950">Featured {featured.category}</span>
              <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-tight md:text-6xl">{featured.title}</h2>
              <p className="mt-4 max-w-xl text-stone-200">{featured.excerpt}</p>
              <p className="mt-6 inline-flex items-center gap-2 font-black text-amber-300">Read full post <ArrowRight size={18} /></p>
            </div>
          </Link>
          <div className="grid gap-5">
            <div className="rounded-[32px] bg-stone-950 p-7 text-white shadow-[0_24px_70px_rgba(28,25,23,.2)]">
              <Newspaper className="text-amber-300" size={30} />
              <h2 className="mt-5 font-serif text-4xl">Reading room</h2>
              <p className="mt-4 leading-7 text-stone-300">Admin-published posts flow here automatically, so customer education, news and articles stay tied to the live backend.</p>
            </div>
            <div className="rounded-[32px] border border-stone-200 bg-white p-7 shadow-sm">
              <BookOpen className="text-amber-700" size={30} />
              <h2 className="mt-5 font-serif text-4xl text-stone-950">{blogPosts.length} published reads</h2>
              <p className="mt-4 leading-7 text-stone-600">Fresh atta storage, wheat benefits, multigrain choices, delivery updates and subscription notes.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-700"><Sparkles size={18} /> Latest reads</p>
            <h2 className="mt-2 font-serif text-4xl text-stone-950">Open any blog, news or article</h2>
          </div>
          <p className="text-sm font-semibold text-stone-500">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
        </div>

        {filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-[0_18px_50px_rgba(74,52,30,.1)] transition hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={post.hero} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  {post.tags?.length ? <p className="mt-3 text-xs font-bold text-stone-500">{post.tags.map((tag) => `#${tag}`).join(" ")}</p> : null}
                  <h3 className="mt-4 font-serif text-3xl leading-tight text-stone-950">{post.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{post.excerpt}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-black text-stone-950">Read full {post.category.toLowerCase()} <ArrowRight size={16} /></p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-stone-200 bg-white p-10 text-center shadow-sm">
            <Newspaper className="mx-auto text-amber-700" size={34} />
            <h2 className="mt-4 font-serif text-4xl text-stone-950">No matching posts</h2>
            <p className="mt-3 text-stone-600">Try a different search or category.</p>
          </div>
        )}
      </section>
    </main>
  );
}
