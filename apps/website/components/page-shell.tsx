import { PremiumHeroCarousel } from "@/components/premium-hero-carousel";

const pageHeroImages = [
  "/assets/banners/wheat-field-dawn.png",
  "/assets/banners/dough-kitchen.png",
  "/assets/banners/flour-chakki-still-life.png"
];

export function PageShell({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fffdf7] pt-16">
      <section className="relative min-h-[360px] overflow-hidden bg-[#f7eedc] px-5 py-20 text-[#3b2418] md:min-h-[420px] md:px-10">
        <PremiumHeroCarousel images={pageHeroImages} alt="Fresh wheat and chakki-crafted atta" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fffdf7]/98 via-[#fffdf7]/82 to-[#fffdf7]/12" />
        <div className="relative mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#a9600f]">{eyebrow}</p> : null}
            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-[#3b2418] md:text-6xl">{title}</h1>
            {text ? <p className="mt-5 max-w-2xl text-base leading-7 text-[#68412a]/75">{text}</p> : null}
          </div>
          <div className="hidden rounded-2xl border border-[#e8dcc8] bg-white/70 p-5 text-sm font-semibold text-[#3b2418] shadow-[0_16px_40px_rgba(104,65,42,.12)] backdrop-blur-md md:block">
            <p className="text-[#a9600f]">Fresh-milled standard</p>
            <p className="mt-2 text-[#68412a]/70">Real products, real pricing, freshly packed.</p>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
