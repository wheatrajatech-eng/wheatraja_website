"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { addToCart, Weight } from "@/lib/cart";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export function AddToCartButton({ slug, weight, quantity = 1, subscription = false, label = "Add to Cart" }: { slug: string; weight: Weight; quantity?: number; subscription?: boolean; label?: string }) {
  const [added, setAdded] = useState(false);
  return (
    <span className="relative inline-flex w-full">
      <button
        type="button"
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-95"
        onClick={() => {
          addToCart({ slug, weight, quantity, subscription });
          fetch(`${apiBase}/cart/items`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug, weight_kg: weight, quantity, subscription })
            }).catch(() => {});
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1800);
        }}
      >
        <ShoppingBag size={16} />
        {added ? "Added" : label}
      </button>
      {added ? (
        <span role="status" className="absolute left-1/2 top-[calc(100%+8px)] z-20 w-max -translate-x-1/2 rounded-full bg-forest px-3 py-1 text-xs font-bold text-cream shadow-card">
          Added to fresh basket
        </span>
      ) : null}
    </span>
  );
}
