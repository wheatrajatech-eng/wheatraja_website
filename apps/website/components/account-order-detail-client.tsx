"use client";

import { CalendarClock, Download, PackageCheck, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Order = {
  id: string;
  phone: string;
  address: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  coupon_discount: number;
  delivery_charge: number;
  wallet_amount?: number;
  payable_amount?: number;
  created_at: string;
  items: Array<{ name: string; weight_kg: number; quantity: number; unit_price: number }>;
};

type Shipment = {
  status: string;
  provider?: string | null;
  tracking_number?: string | null;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  events?: Array<{ id: number; status: string; location?: string | null; note?: string | null; occurred_at?: string | null }>;
};

export function AccountOrderDetailClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [downloadState, setDownloadState] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [orderRes, shipmentRes] = await Promise.all([
          fetch(`${apiBase}/orders/${orderId}`, { credentials: "include", cache: "no-store" }),
          fetch(`${apiBase}/shipments/my/${orderId}`, { credentials: "include", cache: "no-store" })
        ]);
        if (!orderRes.ok) throw new Error("Order not found");
        setOrder(await orderRes.json());
        if (shipmentRes.ok) setShipment(await shipmentRes.json());
        setState("ready");
      } catch {
        setState("error");
      }
    }
    load();
  }, [orderId]);

  if (state === "loading") return <section className="mx-auto max-w-5xl px-4 py-12"><p className="account-card rounded-[14px] p-5 text-sm font-semibold text-[#6F624F]">Loading order...</p></section>;
  if (state === "error" || !order) return <section className="mx-auto max-w-5xl px-4 py-12"><p className="account-card rounded-[14px] p-5 text-sm font-semibold text-red-700">We could not load this order.</p></section>;

  async function downloadInvoicePdf() {
    setDownloadState("Preparing invoice...");
    try {
      const response = await fetch(`${apiBase}/invoices/${orderId}/pdf`, { credentials: "include" });
      if (!response.ok) throw new Error("Invoice PDF is not available yet.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `INV-${orderId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadState("Invoice downloaded.");
    } catch (error) {
      setDownloadState(error instanceof Error ? error.message : "Download failed.");
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-12 lg:grid-cols-[1.2fr_.8fr]">
      <article className="account-card rounded-[14px] p-6" id="invoice">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#B8780C]">Invoice</p>
            <h2 className="mt-2 font-serif text-4xl text-[#1A120A]">{order.id}</h2>
            <p className="mt-2 text-sm text-[#6F624F]">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-[10px] bg-[#3A6644] px-4 py-3 text-sm font-black text-white"><Printer size={16} /> Print</button>
            <button onClick={downloadInvoicePdf} className="inline-flex items-center gap-2 rounded-[10px] bg-[#F0E6CE] px-4 py-3 text-sm font-black text-[#3A2A18]"><Download size={16} /> Download</button>
          </div>
        </div>
        {downloadState ? <p className="mt-3 text-sm font-bold text-[#6F624F]">{downloadState}</p> : null}
        <div className="mt-6 rounded-[12px] bg-[#FBFAF7] p-4 text-sm text-[#6F624F]">
          <p><strong className="text-[#1A120A]">Phone:</strong> {order.phone}</p>
          <p className="mt-1"><strong className="text-[#1A120A]">Address:</strong> {order.address}</p>
          <p className="mt-1"><strong className="text-[#1A120A]">Status:</strong> {order.status.replaceAll("_", " ")} / {order.payment_status.replaceAll("_", " ")}</p>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[.14em] text-[#8A7C66]"><tr><th className="py-3">Item</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-t border-[#4A2F18]/10">
                  <td className="py-3 font-bold text-[#1A120A]">{item.name} {item.weight_kg} kg</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-2 text-sm text-[#6F624F]">
          <p className="flex justify-between"><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></p>
          <p className="flex justify-between"><span>Discount</span><strong>-{formatPrice(order.coupon_discount)}</strong></p>
          <p className="flex justify-between"><span>Delivery</span><strong>{formatPrice(order.delivery_charge)}</strong></p>
          <p className="flex justify-between"><span>Wallet</span><strong>-{formatPrice(order.wallet_amount ?? 0)}</strong></p>
          <p className="flex justify-between border-t border-[#4A2F18]/10 pt-3 text-lg text-[#1A120A]"><span>Total</span><strong>{formatPrice(order.total)}</strong></p>
        </div>
      </article>

      <aside className="grid h-fit gap-5">
        <div className="account-card rounded-[14px] p-6">
          <PackageCheck className="text-[#B8780C]" size={28} />
          <h2 className="mt-3 text-2xl font-black text-[#1A120A]">Shipment</h2>
          <p className="mt-2 text-sm text-[#6F624F]">{shipment?.provider || "Courier pending"} / {shipment?.tracking_number || "Tracking pending"}</p>
          <p className="mt-2 rounded-full bg-[#F0E6CE] px-4 py-2 text-sm font-black text-[#3A2A18]">{shipment?.status?.replaceAll("_", " ") || "not shipped"}</p>
        </div>
        <div className="account-card rounded-[14px] p-6">
          <h2 className="text-2xl font-black text-[#1A120A]">Timeline</h2>
          <div className="mt-4 grid gap-3">
            {shipment?.events?.length ? shipment.events.map((event) => (
              <div key={event.id} className="rounded-[10px] bg-[#FBFAF7] p-4">
                <div className="flex items-center gap-2 text-sm font-black text-[#1A120A]"><CalendarClock size={16} /> {event.status.replaceAll("_", " ")}</div>
                <p className="mt-1 text-sm text-[#6F624F]">{event.note || event.location || "Shipment event recorded"}</p>
                {event.occurred_at ? <p className="mt-1 text-xs font-bold text-[#8A7C66]">{new Date(event.occurred_at).toLocaleString()}</p> : null}
              </div>
            )) : <p className="rounded-[10px] bg-[#FBFAF7] p-4 text-sm text-[#6F624F]">Shipment timeline will appear once the admin creates shipment events.</p>}
          </div>
        </div>
        <Link href="/account/orders" className="rounded-[10px] bg-[#F0E6CE] px-4 py-3 text-center text-sm font-black text-[#3A2A18]">Back to orders</Link>
      </aside>
    </section>
  );
}
