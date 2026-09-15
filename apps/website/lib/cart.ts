"use client";

import { products } from "@/lib/data";

export type Weight = 1 | 5 | 10;
export type CartItem = { slug: string; weight: Weight; quantity: number; subscription?: boolean };

const KEY = "wr_cart_v2";
const LEGACY_KEY = "wr_cart";

function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      slug: String(item?.slug || ""),
      weight: Number(item?.weight || item?.weight_kg) === 1 ? 1 as Weight : Number(item?.weight || item?.weight_kg) === 10 ? 10 as Weight : 5 as Weight,
      quantity: Math.max(1, Math.min(20, Number(item?.quantity || 1))),
      subscription: Boolean(item?.subscription)
    }))
    .filter((item) => products.some((product) => product.slug === item.slug));
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = window.localStorage.getItem(KEY);
    if (current) return normalizeItems(JSON.parse(current));
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (!legacy) return [];
    const migrated = normalizeItems(JSON.parse(legacy));
    if (migrated.length) writeCart(migrated);
    return migrated;
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  const clean = normalizeItems(items).filter((item) => item.quantity > 0);
  window.localStorage.setItem(KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent("wr-cart", { detail: clean }));
}

export function addToCart(item: CartItem) {
  const current = readCart();
  const existing = current.find((row) => row.slug === item.slug && row.weight === item.weight && !!row.subscription === !!item.subscription);
  if (existing) existing.quantity += item.quantity;
  else current.push(item);
  writeCart(current);
}

export function updateCartItem(index: number, quantity: number) {
  const current = readCart();
  if (quantity <= 0) current.splice(index, 1);
  else if (current[index]) current[index].quantity = quantity;
  writeCart(current);
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(items = readCart()) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function priceFor(slug: string, weight: Weight) {
  const product = products.find((item) => item.slug === slug);
  if (!product) return 0;
  if (weight === 1) return product.price1;
  return weight === 5 ? product.price5 : product.price10;
}

export function summarizeCart(items: CartItem[], coupon = "") {
  const subtotal = items.reduce((sum, item) => sum + priceFor(item.slug, item.weight) * item.quantity * (item.subscription ? 0.9 : 1), 0);
  const couponDiscount = coupon.trim().toUpperCase() === "SAVE05" ? Math.round(subtotal * 0.05) : 0;
  const freeGift = subtotal >= 999;
  const walletEarned = Math.floor((subtotal - couponDiscount) * 0.02);
  return { subtotal, couponDiscount, freeGift, walletEarned, total: subtotal - couponDiscount };
}
