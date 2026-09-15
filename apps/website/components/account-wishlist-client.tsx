"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { csrfHeaders } from "@/lib/csrf";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Product = {
  slug: string;
  name: string;
  description?: string;
  variants?: Array<{ weight_kg: number; price: number; inventory: number }>;
  images?: Array<{ url: string; alt?: string }>;
};

export function AccountWishlistClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`${apiBase}/wishlist`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load wishlist");
      setItems(await response.json());
      setState("ready");
    } catch {
      setMessage("We could not load your wishlist right now.");
      setState("error");
    }
  }

  async function remove(slug: string) {
    const response = await fetch(`${apiBase}/wishlist/${slug}`, { method: "DELETE", credentials: "include", headers: csrfHeaders() });
    if (response.ok) setItems(await response.json());
  }

  async function moveToCart(slug: string, weight_kg: number) {
    const response = await fetch(`${apiBase}/wishlist/move-to-cart`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ slug, weight_kg, quantity: 1 })
    });
    if (response.ok) {
      const payload = await response.json();
      setItems(payload.wishlist ?? []);
      setMessage("Moved to cart.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {state === "loading" ? <p className="account-card rounded-[14px] p-5 text-sm font-semibold text-[#6F624F]">Loading wishlist...</p> : null}
      {state === "error" ? <p className="account-card rounded-[14px] p-5 text-sm font-semibold text-red-700">{message}</p> : null}
      {state === "ready" && !items.length ? (
        <div className="account-card rounded-[14px] p-8 text-center">
          <Heart className="mx-auto text-[#B8780C]" size={34} />
          <h2 className="mt-4 text-2xl font-black text-[#1A120A]">Your wishlist is empty</h2>
          <p className="mt-2 text-[#6F624F]">Save products you want to reorder or compare later.</p>
          <Link href="/products" className="mt-5 inline-flex rounded-[10px] bg-[#3A6644] px-5 py-3 text-sm font-black text-white">Browse products</Link>
        </div>
      ) : null}
      {state === "ready" && items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const variant = item.variants?.[0];
            return (
              <article key={item.slug} className="account-card overflow-hidden rounded-[14px]">
                {item.images?.[0]?.url ? <img src={item.images[0].url} alt={item.images[0].alt || item.name} className="h-48 w-full object-cover" /> : null}
                <div className="p-5">
                  <h2 className="text-xl font-black text-[#1A120A]">{item.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F624F]">{item.description}</p>
                  <p className="mt-4 text-lg font-black text-[#B8780C]">{variant ? `${variant.weight_kg} kg / ${formatPrice(variant.price)}` : "Variant unavailable"}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button disabled={!variant} onClick={() => moveToCart(item.slug, variant?.weight_kg ?? 5)} className="inline-flex items-center gap-2 rounded-[10px] bg-[#3A6644] px-4 py-3 text-sm font-black text-white disabled:opacity-45">
                      <ShoppingCart size={16} />
                      Move to cart
                    </button>
                    <button onClick={() => remove(item.slug)} className="inline-flex items-center gap-2 rounded-[10px] bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
