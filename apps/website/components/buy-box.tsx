"use client";

import Link from "next/link";
import { Award, BadgeCheck, Check, Minus, Plus, RefreshCw, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Product } from "@/lib/data";
import { Weight } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

export function BuyBox({ product }: { product: Product }) {
  const [weight, setWeight] = useState<Weight>(5);
  const [quantity, setQuantity] = useState(1);
  const price = weight === 1 ? product.price1 : weight === 5 ? product.price5 : product.price10;

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">Fresh atta</p>
      <h1 className="mb-2 font-serif text-3xl font-bold text-stone-900 md:text-4xl">{product.name}</h1>
      <p className="mb-4 text-base text-stone-500">{product.subtitle}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {product.notes.slice(0, 3).map((note) => (
          <span key={note} className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
            <Check className="h-3.5 w-3.5" />{note}
          </span>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-stone-900">{formatPrice(price)}</span>
          <span className="text-lg text-stone-400 line-through">{formatPrice(Math.round(price * 1.12))}</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-sm font-bold text-green-700">10% OFF</span>
        </div>
        <p className="text-sm font-medium text-green-700">
          Subscribe price: <span className="font-bold">{formatPrice(Math.round(price * 0.9))}</span> / delivery
        </p>
      </div>

      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-stone-700">Choose pack size</p>
        <div className="grid grid-cols-3 gap-2">
          {([1, 5, 10] as Weight[]).map((option) => (
            <button
              key={option}
              onClick={() => setWeight(option)}
              className={`rounded-xl border p-4 text-left font-semibold transition ${weight === option ? "border-amber-500 bg-amber-600 text-white" : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"}`}
            >
              {option} KG<br /><span>{formatPrice(option === 1 ? product.price1 : option === 5 ? product.price5 : product.price10)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <span className="text-sm font-semibold text-stone-700">Quantity</span>
        <div className="flex items-center gap-3 rounded-full bg-stone-100 px-4 py-2.5">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-stone-500 transition hover:text-stone-900"><Minus className="h-4 w-4" /></button>
          <span className="min-w-6 text-center font-bold text-stone-900">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="text-stone-500 transition hover:text-stone-900"><Plus className="h-4 w-4" /></button>
        </div>
        <span className="text-sm text-stone-500">Total {formatPrice(price * quantity)}</span>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AddToCartButton slug={product.slug} weight={weight} quantity={quantity} />
        <AddToCartButton slug={product.slug} weight={weight} quantity={quantity} subscription label="Subscribe" />
        <Link href="/checkout" className="flex items-center justify-center rounded-xl bg-stone-900 py-3.5 text-sm font-bold text-white transition hover:bg-stone-800">Buy Now</Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: BadgeCheck, label: "FSSAI Approved" },
          { icon: Award, label: "NABL Certified" },
          { icon: Truck, label: "Local Delivery" },
          { icon: Shield, label: "Freshness Promise" }
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <Icon className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="text-xs font-medium text-stone-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
