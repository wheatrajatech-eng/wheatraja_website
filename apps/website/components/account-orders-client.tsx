"use client";

import Link from "next/link";
import { CalendarClock, PackageCheck, RotateCcw, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { csrfHeaders } from "@/lib/csrf";
import { addToCart } from "@/lib/cart";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Order = { id: string; status: string; payment_status?: string; total: number; delivery_area?: string; created_at: string; items: { slug: string; name: string; weight_kg: 1 | 5 | 10; quantity: number; subscription?: boolean }[] };
type Wallet = { balance: number; transactions: { id: number; amount: number; transaction_type: string; reason: string; created_at: string }[] };

function itemLabel(order: Order) {
  return order.items.map((item) => `${item.name} ${item.weight_kg} KG x ${item.quantity}`).join(", ");
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

const trackingSteps = ["placed", "milling", "packed", "shipped", "out_for_delivery", "delivered"];

export function AccountOrdersClient({ mode = "orders" }: { mode?: "orders" | "tracking" | "wallet" }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState(1000);
  const [walletStatus, setWalletStatus] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${apiBase}/orders`, { credentials: "include", cache: "no-store" }).then((r) => r.ok ? r.json() : []).then(setOrders).catch(() => {});
    if (mode === "wallet") {
      fetch(`${apiBase}/wallet`, { credentials: "include", cache: "no-store" }).then((r) => r.ok ? r.json() : null).then(setWallet).catch(() => {});
    }
  }, [mode]);

  async function rechargeWallet() {
    setWalletStatus("Recharging...");
    const response = await fetch(`${apiBase}/wallet/recharge`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ amount: rechargeAmount })
    });
    if (!response.ok) {
      setWalletStatus("Could not recharge wallet");
      return;
    }
    setWallet(await response.json());
    setWalletStatus("Wallet recharged");
  }

  async function reloadOrders() {
    const response = await fetch(`${apiBase}/orders`, { credentials: "include", cache: "no-store" });
    if (response.ok) setOrders(await response.json());
  }

  async function cancelOrder(orderId: string) {
    if (!window.confirm("Cancel this order?")) return;
    setOrderStatus("Cancelling order...");
    try {
    const response = await fetch(`${apiBase}/orders/${orderId}/cancel`, { method: "POST", credentials: "include", headers: csrfHeaders() });
    const payload = await response.json();
    setOrderStatus(response.ok ? "Order cancelled" : typeof payload.detail === "string" ? payload.detail : "Could not cancel this order");
    await reloadOrders();
    } catch { setOrderStatus("Connection interrupted. Refresh your orders to check the result before retrying."); }
  }

  async function requestReturn(orderId: string) {
    const reason = window.prompt("Reason for return request");
    if (!reason) return;
    setOrderStatus("Submitting return request...");
    try {
    const response = await fetch(`${apiBase}/returns`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ order_id: orderId, reason })
    });
    const payload = await response.json();
    setOrderStatus(response.ok ? "Return request submitted" : typeof payload.detail === "string" ? payload.detail : "Could not submit return request");
    await reloadOrders();
    } catch { setOrderStatus("Connection interrupted. Refresh your orders to check the result before retrying."); }
  }

  function reorder(order: Order) {
    order.items.forEach((item) => addToCart({ slug: item.slug, weight: item.weight_kg, quantity: item.quantity, subscription: Boolean(item.subscription) }));
    setOrderStatus("Previous order added to cart. You can review quantities before checkout.");
  }

  if (mode === "wallet") {
    return (
      <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[14px] bg-[linear-gradient(135deg,#1A120A,#3A6644)] p-7 text-white shadow-[0_24px_70px_rgba(26,18,10,.18)]">
            <WalletCards size={28} className="text-[#D4960E]" />
            <p className="mt-5 text-sm font-bold uppercase tracking-[.18em] text-[#D4960E]">WR Wallet</p>
            <p className="mt-3 font-serif text-5xl">{formatPrice(wallet?.balance ?? 0)}</p>
            <p className="mt-3 text-sm text-white/75">INR store credit for checkout and subscription billing.</p>
            <div className="mt-6 grid gap-3">
              <input type="number" min={50} max={50000} value={rechargeAmount} onChange={(event) => setRechargeAmount(Number(event.target.value || 0))} className="rounded-[10px] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 outline-none" />
              <button onClick={rechargeWallet} className="rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#1A120A]">Recharge Wallet</button>
              {walletStatus ? <p className="text-sm font-bold text-[#F0E6CE]">{walletStatus}</p> : null}
            </div>
          </div>
          <div className="account-card rounded-[14px] p-7">
            <h2 className="font-serif text-3xl text-[#1A120A]">Wallet ledger</h2>
            <div className="mt-5 grid gap-3">
              {wallet?.transactions?.length ? wallet.transactions.map((row) => (
                <p key={row.id} className="flex justify-between gap-4 rounded-[10px] bg-[#F0E6CE] p-4 text-sm">
                  <span>{row.reason}</span>
                  <span className={row.amount >= 0 ? "font-bold text-green-700" : "font-bold text-red-600"}>{row.amount >= 0 ? "+" : ""}{formatPrice(row.amount)}</span>
                </p>
              )) : <p className="rounded-[10px] bg-[#F0E6CE] p-4 text-sm text-[#6F624F]">No wallet activity yet.</p>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        {orderStatus ? <p className="mb-4 rounded-[10px] bg-[#F0E6CE] p-3 text-sm font-bold text-[#3A2A18]">{orderStatus}</p> : null}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-[10px] border border-[#4A2F18]/10 bg-white px-4 py-3 text-sm font-bold text-[#3A2A18] outline-none">
            <option value="all">All orders</option>
            {Array.from(new Set(orders.map((order) => order.status))).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <p className="text-sm font-semibold text-[#6F624F]">Showing {orders.filter((order) => filter === "all" || order.status === filter).length} of {orders.length}</p>
        </div>
        {orders.length === 0 ? (
          <div className="account-card rounded-[14px] p-8 text-center">
            <PackageCheck className="mx-auto text-[#B8780C]" size={34} />
            <h2 className="mt-4 font-serif text-3xl text-[#1A120A]">No backend orders yet</h2>
            <p className="mx-auto mt-3 max-w-lg text-[#6F624F]">Once checkout creates a backend order, milling, packing and delivery updates will appear here.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-[10px] bg-[#3A6644] px-5 py-3 text-sm font-bold text-white">Order Fresh Atta</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.filter((order) => filter === "all" || order.status === filter).map((order) => (
              <article key={order.id} className="account-card rounded-[14px] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-[#B8780C]">{order.id}</p>
                    <h2 className="mt-2 font-serif text-3xl text-[#1A120A]">{itemLabel(order)}</h2>
                    <p className="mt-2 text-sm text-[#6F624F]">{new Date(order.created_at).toLocaleString()} / {order.delivery_area ?? "delivery area pending"}</p>
                  </div>
                  <p className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">{statusLabel(order.status)}</p>
                </div>
                {mode === "tracking" ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={`Order progress: ${statusLabel(order.status)}`}>
                    {!trackingSteps.includes(order.status) ? <p className="col-span-full rounded-[10px] bg-amber-50 p-4 font-bold text-amber-900">{statusLabel(order.status)}. {order.status === "pending_payment" ? "Fulfilment begins after payment." : "See order details for the latest update."}</p> : null}
                    {trackingSteps.map((step, index) => (
                      <div key={step} aria-current={step === order.status ? "step" : undefined} className={`rounded-[10px] p-4 ${index <= trackingSteps.indexOf(order.status) ? "bg-[#3A6644] text-white" : "bg-[#F0E6CE] text-[#3A2A18]"}`}>
                        <CalendarClock size={18} />
                        <p className="mt-2 text-sm font-bold capitalize">{statusLabel(step)}</p>
                        <p className="mt-1 text-xs">{step === order.status ? "Current stage" : index < trackingSteps.indexOf(order.status) ? "Completed" : "Not reached"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#4A2F18]/10 pt-5 text-sm">
                    <span className="font-bold text-[#1A120A]">{formatPrice(order.total)}</span>
                    <div className="flex flex-wrap gap-2">
                      {["pending_payment", "placed", "milling"].includes(order.status) && !["paid", "demo_paid"].includes(order.payment_status || "") ? <button onClick={() => cancelOrder(order.id)} className="rounded-[10px] bg-red-50 px-4 py-2 font-bold text-red-700">Cancel</button> : null}
                      {["delivered", "out_for_delivery"].includes(order.status) ? <button onClick={() => requestReturn(order.id)} className="rounded-[10px] bg-[#F0E6CE] px-4 py-2 font-bold text-[#3A2A18]">Return</button> : null}
                      <Link href={`/account/orders/${order.id}`} className="rounded-[10px] bg-[#3A6644] px-4 py-2 font-bold text-white">Details</Link>
                      <button onClick={() => reorder(order)} className="inline-flex items-center gap-2 rounded-[10px] bg-[#F0E6CE] px-4 py-2 font-bold text-[#3A6644]"><RotateCcw size={15} /> Reorder</button>
                      <Link href="/cart" className="rounded-[10px] bg-[#D4960E] px-4 py-2 font-bold text-[#1A120A]">Cart</Link>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
