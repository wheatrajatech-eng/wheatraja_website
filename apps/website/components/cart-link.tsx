"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { cartCount, readCart } from "@/lib/cart";

export function CartLink({ transparent = false }: { transparent?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(cartCount(readCart()));
    refresh();
    window.addEventListener("wr-cart", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("wr-cart", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <Link href="/cart" aria-label={`Cart${count ? ` with ${count} items` : ""}`} className={`relative rounded-full p-2 transition ${transparent ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:bg-white/15" : "text-stone-700 hover:bg-stone-100"}`}>
      <ShoppingBag size={20} />
      {count ? (
        <span aria-live="polite" className="absolute -right-2 -top-1 grid h-5 min-w-6 place-items-center rounded-full bg-amber-600 px-1 text-[11px] font-bold text-white shadow-sm">
          +{count}
        </span>
      ) : null}
    </Link>
  );
}
