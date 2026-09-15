import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BuyBox } from "@/components/buy-box";
import { ProductPack } from "@/components/product-pack";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui";
import { getCatalogProduct, getCatalogProducts } from "@/lib/catalog";
import { products, reviews } from "@/lib/data";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  return { title: product?.name ?? "Product", description: product?.subtitle };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const relatedProducts = await getCatalogProducts();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.subtitle,
    image: product.image,
    offers: { "@type": "Offer", priceCurrency: "INR", price: product.price1, availability: "https://schema.org/InStock" }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://wheatraja.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://wheatraja.com/products" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://wheatraja.com/products/${product.slug}` }
    ]
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: product.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a }
    }))
  };

  return (
    <main className="bg-[#FAF7EF] pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="mx-auto grid max-w-7xl gap-10 overflow-hidden px-5 py-12 md:grid-cols-2 md:px-10">
        <div className="grid min-w-0 gap-4">
          <ProductPack product={product} />
          <div className="grid min-w-0 grid-cols-3 gap-3">
            {product.gallery.map((image, index) => (
              <div key={image} className="relative aspect-square overflow-hidden rounded-xl border-2 border-stone-200 bg-white shadow-sm transition hover:border-amber-300">
                <Image src={image} alt={`${product.name} ${[1, 5, 10][index]} KG WheatRaja pack`} fill sizes="(max-width: 768px) 30vw, 180px" className="object-cover transition hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
        <BuyBox product={product} />
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 md:grid-cols-3 md:px-10">
        {product.notes.map((note) => <div key={note} className="rounded-2xl border border-stone-200 bg-white p-6 text-stone-700 shadow-sm">{note}</div>)}
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 md:grid-cols-3 md:px-10">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-serif text-3xl text-stone-900">Ingredients & Nutrition</h2>
          <p className="mt-3 text-stone-600">{product.ingredients}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {product.nutrition.map((item) => <div key={item.label} className="rounded-xl bg-amber-50 p-4"><p className="text-xs uppercase tracking-[.18em] text-amber-700">{item.label}</p><p className="mt-2 font-semibold text-stone-900">{item.value}</p></div>)}
          </div>
        </div>
        <div className="rounded-2xl bg-stone-900 p-6 text-white shadow-sm">
          <h2 className="font-serif text-3xl">Trust Proof</h2>
          <div className="mt-5 flex gap-3">
            <Image src="/assets/trust/WR_FSSAI.png" alt="WheatRaja FSSAI approved badge" width={74} height={74} className="h-[74px] w-[74px] rounded-full object-cover" />
            <Image src="/assets/trust/WR_NABL.png" alt="WheatRaja NABL certified badge" width={74} height={74} className="h-[74px] w-[74px] rounded-full object-cover" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {product.proof.map((item) => <Badge key={item}>{item}</Badge>)}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 md:grid-cols-3 md:px-10">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-900">Best For</h2>
          <div className="mt-4 grid gap-3">{product.bestFor.map((item) => <p key={item} className="rounded-xl bg-stone-50 p-4 font-semibold text-stone-700">{item}</p>)}</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-serif text-3xl text-stone-900">Better than stored packaged atta</h2>
          <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
            {product.comparison.map((row) => (
              <div key={row.label} className="grid grid-cols-3 border-b border-stone-200 text-sm">
                <p className="bg-amber-50 p-4 font-bold text-stone-900">{row.label}</p>
                <p className="p-4 text-green-700">{row.wheatRaja}</p>
                <p className="p-4 text-stone-500">{row.packaged}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-20 md:grid-cols-2 md:px-10">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-900">Storage Instructions</h2>
          <ul className="mt-4 grid gap-3">
            {product.storage.map((item) => <li key={item} className="rounded-xl bg-stone-50 p-4 text-stone-600">{item}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl bg-stone-900 p-6 text-white shadow-sm">
          <h2 className="font-serif text-3xl">Customer Reviews</h2>
          <div className="mt-5 grid gap-4">
            {reviews.slice(0, 2).map((review) => <blockquote key={review.name} className="rounded-[8px] bg-white/10 p-4">"{review.text}"<span className="mt-3 block text-sm font-bold text-wheat">{review.name}</span></blockquote>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 pb-20 md:px-10">
        <h2 className="font-serif text-3xl text-stone-900">FAQs</h2>
        <div className="mt-5 grid gap-3">
          {product.faqs.map((faq) => <div key={faq.q} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="font-semibold text-stone-900">{faq.q}</p><p className="mt-2 text-stone-500">{faq.a}</p></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-10">
        <h2 className="font-serif text-3xl text-stone-900">Related fresh atta</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {relatedProducts.filter((item) => item.slug !== product.slug).map((item) => <ProductCard key={item.slug} product={item} />)}
        </div>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-mitti/10 bg-cream/95 p-3 shadow-glow backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-serif text-lg text-forest">{product.name}</p>
            <p className="text-xs text-mitti/70">1 KG from Rs. {product.price1}</p>
          </div>
          <AddToCartButton slug={product.slug} weight={1} label="Add" />
        </div>
      </div>
    </main>
  );
}
