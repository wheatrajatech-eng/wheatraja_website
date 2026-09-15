export function PageShell({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FAF7EF] pt-16">
      <section className="bg-stone-900 px-5 py-14 text-white md:px-10">
        <div className="relative mx-auto grid max-w-7xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-400">{eyebrow}</p> : null}
            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-white md:text-6xl">{title}</h1>
            {text ? <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">{text}</p> : null}
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-5 text-sm font-semibold text-white shadow-sm md:block">
            <p className="text-amber-400">Fresh-milled standard</p>
            <p className="mt-2 text-white/55">Real backend, real products, real pricing.</p>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
