"use client";

import { BadgeIndianRupee, Package, RefreshCw, ShoppingCart, Users, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { createApiClient } from "../../shared/api-client";
import type { AdminSummary } from "../../shared/types";

const api = createApiClient();

function money(value?: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value ?? 0);
}

export function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);

  useEffect(() => {
    api.get<AdminSummary>("/admin/summary", { cache: "no-store" }).then(setSummary).catch(() => setSummary(null));
  }, []);

  const metrics = summary?.metrics;
  const cards = [
    [BadgeIndianRupee, money(metrics?.total_revenue ?? metrics?.revenue), "Revenue"],
    [ShoppingCart, String(metrics?.total_orders ?? metrics?.orders ?? 0), "Orders"],
    [Users, String(metrics?.customers ?? 0), "Customers"],
    [RefreshCw, String(metrics?.subscriptions ?? 0), "Subscriptions"],
    [Package, String(metrics?.low_stock_products ?? 0), "Low stock"],
    [WalletCards, money(metrics?.wallet_liability), "Wallet liability"]
  ] as const;

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Operations overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">Live admin KPIs, fulfilment signals and recent commerce activity from the backend.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([Icon, value, label]) => (
          <div key={label} className="admin-card rounded-[14px] p-5">
            <div className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#D4960E]/15 text-[#D4960E]"><Icon size={22} /></div>
            <p className="mt-5 text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-sm text-white/55">{label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <div className="admin-card rounded-[14px] p-5">
          <h2 className="text-xl font-black">Recent orders</h2>
          <div className="mt-4 grid gap-3">
            {summary?.recent_orders?.length ? summary.recent_orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-white/[.045] p-4">
                <div>
                  <p className="font-black text-white">{order.id}</p>
                  <p className="text-sm text-white/55">{order.phone} / {order.status}</p>
                </div>
                <p className="font-black text-[#D4960E]">{money(order.total)}</p>
              </div>
            )) : <p className="rounded-[10px] bg-white/[.045] p-4 text-sm text-white/55">No recent order data available.</p>}
          </div>
        </div>
        <div className="admin-card rounded-[14px] p-5">
          <h2 className="text-xl font-black">Product mix</h2>
          <div className="mt-4 grid gap-3">
            {summary?.product_mix?.length ? summary.product_mix.slice(0, 8).map((item) => (
              <div key={item.name} className="rounded-[10px] bg-white/[.045] p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-white/80">{item.name}</span>
                  <span className="font-black text-white">{item.count}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D4960E]" style={{ width: `${Math.min(100, item.count * 12)}%` }} />
                </div>
              </div>
            )) : <p className="rounded-[10px] bg-white/[.045] p-4 text-sm text-white/55">No product mix data available.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
