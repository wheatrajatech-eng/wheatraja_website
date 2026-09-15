"use client";

import Link from "next/link";
import { Bell, Gift, Heart, HelpCircle, Home, LogOut, PackageCheck, RefreshCw, Settings, Sparkles, Star, TrendingUp, Truck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { SignOutButton } from "@/components/sign-out-button";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

const nav = [
  ["Dashboard", "/account", TrendingUp],
  ["My Orders", "/account/orders", PackageCheck],
  ["Subscriptions", "/account/subscriptions", RefreshCw],
  ["Atta Finder", "/atta-finder", Sparkles],
  ["Wallet", "/account/wallet", WalletCards],
  ["Wishlist", "/account/wishlist", Heart],
  ["Notifications", "/account/notifications", Bell],
  ["Reminders", "/account/reminders", Bell],
  ["Refer & Earn", "/account/refer", Gift],
  ["Support", "/account/support", HelpCircle],
  ["Addresses", "/account/addresses", Home],
  ["My Reviews", "/reviews", Star],
  ["Settings", "/account/profile", Settings]
] as const;

type Me = { phone: string; name?: string | null; wallet_points: number; referral_code?: string };
type Order = { id: string; status: string; total: number; created_at: string; items: { name: string; weight_kg: number; quantity: number }[] };
type Wallet = { balance: number };
type Subscription = { id: number; active: boolean };
type Reminder = { id: number; kind: string; status: string; reminder_at: string; payload?: { order_id?: string; subscription_id?: number; message?: string } };

function statusLabel(value?: string) {
  return (value ?? "pending").replaceAll("_", " ");
}

export function AccountDashboardClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    async function load() {
      const [meRes, ordersRes, walletRes, subsRes] = await Promise.all([
        fetch(`${apiBase}/auth/me`, { credentials: "include", cache: "no-store" }),
        fetch(`${apiBase}/orders`, { credentials: "include", cache: "no-store" }),
        fetch(`${apiBase}/wallet`, { credentials: "include", cache: "no-store" }),
        fetch(`${apiBase}/subscriptions`, { credentials: "include", cache: "no-store" })
      ]);
      const remindersRes = await fetch(`${apiBase}/reminders`, { credentials: "include", cache: "no-store" });
      if (meRes.ok) setMe(await meRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (walletRes.ok) setWallet(await walletRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
      if (remindersRes.ok) setReminders(await remindersRes.json());
    }
    load().catch(() => {});
  }, []);

  const displayName = me?.name || "Wheat Raja customer";
  const initial = displayName.charAt(0).toUpperCase();
  const activeOrder = orders.find((order) => !["delivered", "cancelled"].includes(order.status)) ?? orders[0];
  const activeSubscriptions = subscriptions.filter((item) => item.active).length;
  const walletBalance = wallet?.balance ?? me?.wallet_points ?? 0;
  const nextReminder = reminders.find((row) => row.status === "queued") ?? reminders.find((row) => row.status === "processing") ?? reminders[0];

  return (
    <main className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="account-card h-fit rounded-[14px] p-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#B8780C] text-xl font-black text-white">{initial}</div>
            <div>
              <p className="text-base font-black text-[#1A120A]">{displayName}</p>
              <p className="text-sm text-[#6F624F]">+91 {me?.phone ?? "loading"}</p>
            </div>
          </div>
          <div className="my-6 h-px bg-[#4A2F18]/10" />
          <nav className="hidden gap-2 lg:grid">
            {nav.map(([label, href, Icon], index) => (
              <Link key={label} href={href} className={`flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-bold transition ${index === 0 ? "bg-[#B8780C]/12 text-[#B8780C]" : "text-[#6F624F] hover:bg-[#F0E6CE] hover:text-[#3A6644]"}`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map(([label, href, Icon], index) => (
              <Link key={label} href={href} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${index === 0 ? "bg-[#B8780C] text-white" : "bg-[#F0E6CE] text-[#3A2A18]"}`}>
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </aside>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-[#B8780C]">Wheat Raja account</p>
              <h1 className="mt-2 font-serif text-4xl text-[#1A120A] md:text-5xl">Good morning, {displayName}</h1>
              <p className="mt-2 text-base text-[#6F624F]">Live orders, wallet balance, subscriptions and referral rewards in one place.</p>
            </div>
            <Link href="/products" className="rounded-[10px] bg-[#3A6644] px-5 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(58,102,68,.20)]">Order Fresh Atta</Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [PackageCheck, String(orders.length), "Total Orders", "bg-blue-50 text-blue-600"],
              [RefreshCw, String(activeSubscriptions), "Active Subscriptions", "bg-green-50 text-green-600"],
              [WalletCards, formatPrice(walletBalance), "Wallet Balance", "bg-amber-50 text-[#B8780C]"],
              [Star, me?.referral_code ?? "----", "Referral Code", "bg-purple-50 text-purple-600"],
              [Bell, nextReminder ? statusLabel(nextReminder.kind) : "None", "Next Reminder", "bg-sky-50 text-sky-600"]
            ].map(([Icon, value, label, tone]) => (
              <div key={String(label)} className="account-card rounded-[14px] p-5 transition hover:-translate-y-1">
                <div className={`grid h-11 w-11 place-items-center rounded-[10px] ${tone}`}>
                  <Icon size={22} />
                </div>
                <p className="mt-5 text-2xl font-black text-[#1A120A]">{String(value)}</p>
                <p className="mt-1 text-sm text-[#6F624F]">{String(label)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[14px] bg-[linear-gradient(135deg,#3A6644,#0F3C2B)] p-6 text-white shadow-[0_26px_80px_rgba(58,102,68,.22)] md:p-8">
            <div className="flex items-center gap-3">
              <Truck size={24} />
              <h2 className="text-2xl font-black">Active Order: {activeOrder ? statusLabel(activeOrder.status) : "No active order"}</h2>
            </div>
            <p className="mt-4 text-lg">{activeOrder ? `${activeOrder.items[0]?.name ?? "Fresh atta"} is in the fulfilment queue.` : "Place an order to see milling, packing and delivery updates here."}</p>
            {nextReminder ? <p className="mt-3 text-sm text-white/80">Next reminder: {new Date(nextReminder.reminder_at).toLocaleDateString()} / {nextReminder.kind.replaceAll("_", " ")}</p> : null}
            <Link href="/account/tracking" className="mt-6 inline-flex rounded-[10px] bg-white px-5 py-3 text-sm font-black text-[#17432F]">Track Order</Link>
          </div>

          <div className="account-card mt-8 rounded-[14px] p-5 md:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#1A120A]">Recent Orders</h2>
              <Link href="/account/orders" className="text-sm font-bold text-[#B8780C]">View All</Link>
            </div>
            <div className="mt-6 grid gap-3">
              {orders.length ? orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#FBFAF7] p-4">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-[#B8780C]/12 text-[#B8780C]"><PackageCheck size={20} /></div>
                    <div>
                      <p className="font-black text-[#1A120A]">{order.items[0]?.name ?? "Fresh Atta"} {order.items[0]?.weight_kg ?? 5} kg</p>
                      <p className="text-sm text-[#6F624F]">{new Date(order.created_at).toLocaleDateString()} / {formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-black text-green-700">{statusLabel(order.status)}</span>
                </div>
              )) : <p className="rounded-[12px] bg-[#FBFAF7] p-4 text-sm font-semibold text-[#6F624F]">No backend orders yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
