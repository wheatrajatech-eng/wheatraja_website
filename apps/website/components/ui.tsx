import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-forest text-cream shadow-glow hover:bg-mitti"
          : "border border-white/50 bg-white/15 text-white backdrop-blur hover:bg-white/25"
      )}
    >
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-clay">{eyebrow}</p> : null}
      <h2 className="font-serif text-3xl text-forest md:text-5xl">{title}</h2>
      {text ? <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-mitti/75">{text}</p> : null}
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-forest/15 bg-white px-3 py-1 text-xs font-semibold text-forest shadow-sm">{children}</span>;
}
