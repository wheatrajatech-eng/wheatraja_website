"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ButtonLink } from "@/components/ui";
import { CartItem, readCart, summarizeCart, updateCartItem } from "@/lib/cart";
import { products } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { csrfHeaders } from "@/lib/csrf";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export function CartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    const refresh = () => setItems(readCart());
    refresh();
    window.addEventListener("wr-cart", refresh);
    return () => window.removeEventListener("wr-cart", refresh);
  }, []);

  const summary = summarizeCart(items, coupon);

  function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === "SAVE05") {
      setCoupon(code);
      setCouponMessage("Coupon applied: 5% off");
      return;
    }
    setCoupon("");
    setCouponMessage(code ? "Invalid coupon code." : "Enter a coupon code first.");
  }

  useEffect(() => {
    const sessionId = window.localStorage.getItem("wr_session_id") || crypto.randomUUID();
    window.localStorage.setItem("wr_session_id", sessionId);
    fetch(`${apiBase}/growth/recovery/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({
        session_id: sessionId,
        items: items.map((item) => ({ slug: item.slug, weight_kg: item.weight, quantity: item.quantity, subscription: Boolean(item.subscription) })),
        subtotal: summary.subtotal,
        checkout_started: false
      })
    }).catch(() => {});
  }, [items, summary.subtotal]);

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 md:grid-cols-[1.4fr_.8fr]">
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="rounded-[8px] border border-wheat/30 bg-white p-8 text-center shadow-card">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-wheat">Fresh basket</p>
            <p className="mt-3 font-serif text-3xl text-forest">Your cart is empty</p>
            <p className="mx-auto mt-3 max-w-md text-mitti/70">Start with one fresh-milled atta pack. Every order is batch-labelled with milled date and packed date.</p>
            <div className="mt-6"><ButtonLink href="/products">Shop Products</ButtonLink></div>
          </div>
        ) : items.map((item, index) => {
          const product = products.find((row) => row.slug === item.slug);
          if (!product) return null;
          const unit = item.weight === 5 ? product.price5 : product.price10;
          return (
            <div key={`${item.slug}-${item.weight}-${index}`} className="grid gap-4 rounded-[8px] border border-mitti/10 bg-white p-5 shadow-card md:grid-cols-[96px_1fr_auto] md:items-center">
              <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden rounded-[8px] bg-cream">
                <Image src={product.gallery[item.weight === 1 ? 0 : item.weight === 5 ? 1 : 2] ?? product.image} alt={`${product.name} ${item.weight} KG pack`} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/products/${product.slug}`} className="font-serif text-2xl text-forest">{product.name}</Link>
                  <span className="rounded-full bg-wheat/15 px-3 py-1 text-xs font-bold text-forest">Milled after checkout</span>
                </div>
                <p className="text-sm text-mitti/70">{item.weight} KG / {item.subscription ? "Monthly subscription" : "One-time order"} / {formatPrice(unit)} each</p>
                <p className="text-sm font-semibold text-mitti">{formatPrice(unit * item.quantity * (item.subscription ? 0.9 : 1))}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-full border border-mitti/15 px-3 py-2" onClick={() => updateCartItem(index, item.quantity - 1)}>-</button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button className="rounded-full border border-mitti/15 px-3 py-2" onClick={() => updateCartItem(index, item.quantity + 1)}>+</button>
                <button className="rounded-full bg-cream px-4 py-2 text-sm font-semibold text-mitti" onClick={() => updateCartItem(index, 0)}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
      <aside className="h-fit rounded-[8px] border border-wheat/30 bg-white p-6 shadow-card">
        <p className="font-serif text-3xl text-forest">Order Summary</p>
        <div className="mt-4 grid gap-2 text-sm text-mitti">
          <p className="flex items-center gap-2"><ShieldCheck size={16} className="text-leaf" /> FSSAI proof and batch label ready before dispatch.</p>
          <p className="flex items-center gap-2"><Truck size={16} className="text-leaf" /> Free delivery within core Noida sectors.</p>
          <p className="flex items-center gap-2"><Gift size={16} className="text-leaf" /> Free 1 KG Multigrain above Rs. 999.</p>
        </div>
        <label className="mt-5 block text-sm font-semibold text-mitti">Coupon</label>
        <form onSubmit={applyCoupon} className="mt-2 grid gap-2">
          <input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} className="w-full rounded-full border border-mitti/15 px-4 py-3" placeholder="SAVE05" aria-label="Coupon code" />
          <button type="submit" className="w-full rounded-full bg-forest px-4 py-3 text-sm font-bold text-cream transition hover:bg-leaf">Apply Coupon</button>
        </form>
        {couponMessage ? (
          <p aria-live="polite" className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-xs font-semibold ${coupon ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-600"}`}>
            <span>{couponMessage}</span>
            {coupon ? (
              <button
                type="button"
                onClick={() => {
                  setCoupon("");
                  setCouponInput("");
                  setCouponMessage("");
                }}
                className="shrink-0 font-bold text-stone-600 underline underline-offset-2 hover:text-stone-900"
              >
                Remove Coupon
              </button>
            ) : null}
          </p>
        ) : null}
        <div className="mt-5 space-y-3 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span>{formatPrice(summary.subtotal)}</span></p>
          <p className="flex justify-between text-leaf"><span>Coupon</span><span>-{formatPrice(summary.couponDiscount)}</span></p>
          <p className="flex justify-between"><span>WR Wallet earned</span><span>{summary.walletEarned} pts</span></p>
          <p className="flex justify-between"><span>Gift eligibility</span><span>{summary.freeGift ? "Included: 1 KG Multigrain" : "Available above Rs. 999"}</span></p>
          <p className="flex justify-between border-t border-mitti/10 pt-4 text-lg font-bold"><span>Total</span><span>{formatPrice(summary.total)}</span></p>
        </div>
        <div className="mt-6">
          {items.length ? (
            <ButtonLink href="/checkout">Checkout Securely</ButtonLink>
          ) : (
            <button disabled className="w-full rounded-full bg-mitti/20 px-5 py-3 font-bold text-mitti/50">Add items to checkout</button>
          )}
        </div>
      </aside>
    </section>
  );
}
