"use client";

import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/csrf";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Ticket = {
  ticket_number: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  created_at?: string;
};

export function AccountSupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState("order");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTickets() {
    const response = await fetch(`${apiBase}/growth/support/tickets`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Could not load support tickets. Please retry.");
    setTickets(await response.json());
  }

  useEffect(() => {
    loadTickets().catch(() => setStatus("Could not load support tickets. Please refresh to retry."));
  }, []);

  async function submitTicket() {
    if (busy) return;
    setBusy(true);
    setStatus("Submitting ticket...");
    try {
    const response = await fetch(`${apiBase}/growth/support/tickets`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ category, subject, message, order_id: orderId || null, priority: category === "refund" || category === "payment" ? "high" : "normal" })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(typeof payload.detail === "string" ? payload.detail : "Please check your subject, message and order ID.");
      return;
    }
    setSubject("");
    setMessage("");
    setOrderId("");
    setStatus(`Ticket ${payload.ticket_number} created.`);
    await loadTickets();
    } catch {
      setStatus("Could not complete the request. Check your connection and ticket list before retrying.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <div className="account-card rounded-[14px] p-7">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#B8780C]">Support Center</p>
          <h1 className="mt-3 font-serif text-4xl text-[#1A120A]">Raise an issue</h1>
          <div className="mt-6 grid gap-3">
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-[10px] border border-[#4A2F18]/10 bg-white px-4 py-3">
              {["order", "delivery", "refund", "product", "subscription", "payment", "general"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} className="rounded-[10px] border border-[#4A2F18]/10 bg-white px-4 py-3" placeholder="Order ID, optional" />
            <input value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-[10px] border border-[#4A2F18]/10 bg-white px-4 py-3" placeholder="Subject" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-32 rounded-[10px] border border-[#4A2F18]/10 bg-white px-4 py-3" placeholder="Explain what happened" />
            <button onClick={submitTicket} disabled={busy || subject.trim().length < 3 || message.trim().length < 5} className="rounded-[10px] bg-[#3A6644] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Submitting..." : "Create Ticket"}</button>
            {status ? <p role="status" className="rounded-[10px] bg-[#F0E6CE] p-3 text-sm font-bold text-[#3A2A18]">{status}</p> : null}
          </div>
        </div>
        <div className="account-card rounded-[14px] p-7">
          <h2 className="font-serif text-3xl text-[#1A120A]">Your tickets</h2>
          <div className="mt-5 grid gap-3">
            {tickets.length ? tickets.map((ticket) => (
              <article key={ticket.ticket_number} className="rounded-[10px] bg-[#F0E6CE] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[#B8780C]">{ticket.ticket_number}</p>
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#3A6644]">{ticket.status}</p>
                </div>
                <h3 className="mt-2 font-serif text-2xl text-[#1A120A]">{ticket.subject}</h3>
                <p className="mt-1 text-sm text-[#6F624F]">{ticket.category} / {ticket.priority}</p>
              </article>
            )) : <p className="rounded-[10px] bg-[#F0E6CE] p-4 text-sm text-[#6F624F]">No support tickets yet.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
