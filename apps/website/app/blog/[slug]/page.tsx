import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Wheat } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { ProductCard } from "@/components/product-card";
import { getBlogProducts, getCatalogBlog, getCatalogBlogs, getCatalogProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getCatalogBlog(slug);
  return { title: post?.seoTitle ?? post?.title ?? "Blog", description: post?.seoDescription ?? post?.excerpt, keywords: post?.metaKeywords };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getCatalogBlog(slug);
  if (!post) notFound();

  const [allPosts, linkedProducts, fallbackProducts] = await Promise.all([getCatalogBlogs(), getBlogProducts(post.slug), getCatalogProducts()]);
  const related = allPosts.filter((item) => item.slug !== post.slug && item.category === post.category).slice(0, 3);
  const recommended = (linkedProducts.length ? linkedProducts : fallbackProducts).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FBF7ED] pt-24">
      <section className="relative overflow-hidden bg-stone-950 px-6 py-16 text-white md:py-24">
        <div className="absolute inset-0 opacity-30">
          <Image src={post.hero} alt={post.title} fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/88 to-stone-950/45" />
        <div className="relative mx-auto max-w-7xl">
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/15">
            <ArrowLeft size={16} /> Back to journal
          </Link>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-amber-300">{post.category} / {post.date}</p>
          <h1 className="mt-4 max-w-5xl font-serif text-5xl leading-[0.95] md:text-7xl">{post.title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-200">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-amber-300">
            <p className="inline-flex items-center gap-2"><Clock3 size={16} /> {post.readTime}</p>
            <p>By {post.author ?? "WheatRaja Team"}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.12)] md:p-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[26px]">
            <Image src={post.hero} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" />
          </div>
          <div className="mt-8">
            <MarkdownContent body={post.body ?? post.content.join("\n\n")} />
          </div>
          {post.gallery?.length ? (
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {post.gallery.map((image) => (
                <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-[24px]">
                  <Image src={image} alt={`${post.title} gallery image`} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
          {post.tags?.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">#{tag}</Link>)}
            </div>
          ) : null}
          <div className="mt-10 rounded-[28px] bg-stone-950 p-7 text-white">
            <Wheat className="text-amber-300" size={28} />
            <p className="mt-4 font-serif text-3xl">Freshness takeaway</p>
            <p className="mt-3 leading-7 text-stone-300">Choose atta by how your family eats: soft daily rotis, richer premium wheat, or multigrain nutrition. WheatRaja keeps the focus on fresh milling and local delivery.</p>
          </div>
        </article>

        <aside className="space-y-5">
          <div className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Article details</p>
            <div className="mt-5 space-y-3 text-sm font-bold text-stone-700">
              <p className="flex justify-between gap-4"><span>Category</span><span>{post.category}</span></p>
              <p className="flex justify-between gap-4"><span>Read time</span><span>{post.readTime}</span></p>
              <p className="flex justify-between gap-4"><span>Published</span><span>{post.date}</span></p>
              <p className="flex justify-between gap-4"><span>Author</span><span>{post.author ?? "WheatRaja Team"}</span></p>
            </div>
          </div>
          <div className="rounded-[30px] bg-stone-950 p-6 text-white shadow-[0_18px_50px_rgba(28,25,23,.2)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Shop this article</p>
            <h2 className="mt-4 font-serif text-3xl">Order or subscribe in minutes.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">Pick 1 KG, 5 KG or 10 KG packs and choose a 15-day or 30-day cycle.</p>
            <Link href="/products" className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-black text-stone-950">
              Shop now <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </section>

      {related.length ? (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h2 className="font-serif text-4xl text-stone-950">Read more {post.category.toLowerCase()}s</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{item.category}</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight text-stone-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">{item.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recommended.length ? (
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif text-4xl text-stone-950">Recommended products</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {recommended.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
