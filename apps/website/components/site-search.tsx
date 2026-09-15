"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteSearch({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/products?q=${encodeURIComponent(value)}` : "/products");
  }

  return (
    <form onSubmit={submit} className={cn("flex min-w-0 items-center gap-3 rounded-full border border-mitti/10 bg-white/72 px-4 py-2 text-sm text-mitti shadow-sm", className)}>
      <Search size={17} className="shrink-0 text-clay" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-mitti/55"
        placeholder="Search Sharbati, Multigrain, 10 KG plans..."
        aria-label="Search WheatRaja products"
      />
      <button type="submit" className="rounded-full bg-forest px-3 py-1.5 text-xs font-black text-cream">Search</button>
    </form>
  );
}
