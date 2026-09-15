"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { Weight } from "@/lib/cart";

const weights: Weight[] = [1, 5, 10];

export function ProductCard({ product }: { product: Product }) {
  const [weight, setWeight] = useState<Weight>(5);
  const price = weight === 1 ? product.price1 : weight === 5 ? product.price5 : product.price10;
  const subPrice = Math.round(price * 0.9);

  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>
        <button className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow backdrop-blur-sm transition hover:scale-110 hover:text-red-500" aria-label="Save product">
          <Heart className="h-4 w-4" />
        </button>
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white">Freshly Milled</span>
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-stone-700 shadow">{weight} KG</span>
        </div>
      </div>

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-serif text-base font-bold leading-snug text-stone-900 transition hover:text-amber-700">{product.name}</h3>
        </Link>
        <p className="mt-1 min-h-10 text-xs leading-relaxed text-stone-500">{product.subtitle}</p>

        <div className="mb-3 mt-3 flex flex-wrap gap-1">
          {product.notes.slice(0, 2).map((note) => (
            <span key={note} className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              {note}
            </span>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {weights.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setWeight(option)}
              className={`rounded-xl border py-2 text-xs font-semibold transition ${weight === option ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 text-stone-600 hover:border-amber-300"}`}
            >
              {option} KG
            </button>
          ))}
        </div>

        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-stone-900">{formatPrice(price)}</span>
          <span className="text-xs text-stone-400 line-through">{formatPrice(Math.round(price * 1.12))}</span>
        </div>
        <div className="mb-4 text-xs font-medium text-green-700">
          Subscribe: {formatPrice(subPrice)}<span className="ml-0.5 font-normal text-stone-400"> / delivery</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <AddToCartButton slug={product.slug} weight={weight} label="Add to Cart" />
          <Link href={`/products/${product.slug}`} className="rounded-full border border-stone-200 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:border-amber-500 hover:text-amber-700">View</Link>
        </div>
      </div>
    </article>
  );
}
