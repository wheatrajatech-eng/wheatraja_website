import Image from "next/image";

const pageBackgrounds: Record<string, string> = {
  Shop: "/assets/banners/products-page-bg.webp",
  "Subscribe & Save 10%": "/assets/banners/subscription-page-bg.webp",
  "Corporate fooding": "/assets/banners/bulk-order-page-bg.webp",
  "Delivery checker": "/assets/banners/delivery-page-bg.webp",
  Checkout: "/assets/banners/delivery-page-bg.webp",
  "Order tracking": "/assets/banners/delivery-page-bg.webp",
  Policy: "/assets/banners/about-page-bg.webp"
};

export function PageShell({ eyebrow, title, text, backgroundImage, children }: { eyebrow?: string; title: string; text?: string; backgroundImage?: string; children?: React.ReactNode }) {
  const background = backgroundImage ?? pageBackgrounds[eyebrow ?? ""] ?? "/assets/banners/about-page-bg.webp";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#fffdf7] pt-16">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Image src={background} alt="" fill priority sizes="100vw" className="object-cover object-center" />
      </div>
      <div className="relative z-10">
        <section className="relative min-h-[360px] overflow-hidden bg-transparent px-5 py-20 text-[#3b2418] md:min-h-[420px] md:px-10">
          <div className="relative mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-3xl">
              {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#a9600f]">{eyebrow}</p> : null}
              <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-[#3b2418] md:text-6xl">{title}</h1>
              {text ? <p className="mt-5 max-w-2xl text-base leading-7 text-[#68412a]/75">{text}</p> : null}
            </div>
            <div className="hidden rounded-2xl border border-[#e8dcc8] bg-[#fffdf7] p-5 text-sm font-semibold text-[#3b2418] shadow-[0_16px_40px_rgba(104,65,42,.12)] md:block">
              <p className="text-[#a9600f]">Fresh-milled standard</p>
              <p className="mt-2 text-[#68412a]/70">Real products, real pricing, freshly packed.</p>
            </div>
          </div>
      </section>
      {children}
      </div>
    </main>
  );
}
