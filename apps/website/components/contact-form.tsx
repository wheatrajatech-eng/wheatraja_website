"use client";

import { Check, Send } from "lucide-react";
import { useMemo, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";
const subjects = ["New order help", "Subscription support", "Delivery check", "Bulk enquiry"];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    subject: subjects[0],
    message: ""
  });
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isReady = useMemo(
    () => form.name.trim().length > 1 && form.contact.trim().length > 5 && form.message.trim().length > 8,
    [form]
  );

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isReady) {
      setStatus("Please add your name, phone or email, and a short message.");
      return;
    }
    setLoading(true);
    setStatus("");
    setSent(false);
    try {
      const response = await fetch(`${apiBase}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.contact.trim(),
          message: `[${form.subject}] ${form.message.trim()}`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not send inquiry");
      setSent(true);
      setStatus(`Inquiry #${data.id} received. Our team will contact you shortly.`);
      setForm({ name: "", contact: "", subject: subjects[0], message: "" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send inquiry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(74,52,30,.12)] md:p-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">Send a message</p>
        <h2 className="mt-3 font-serif text-3xl text-stone-950 md:text-4xl">Tell us what you need</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">Orders, subscriptions, delivery checks, society enquiries and support requests all land with the WheatRaja team.</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-stone-800">
          Full name
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
            placeholder="Your name"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-stone-800">
          Phone or email
          <input
            value={form.contact}
            onChange={(event) => update("contact", event.target.value)}
            className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
            placeholder="+91 98xxx or email"
          />
        </label>
      </div>

      <label className="mt-5 grid gap-2 text-sm font-bold text-stone-800">
        What is this about?
        <select
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-semibold text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
        >
          {subjects.map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
      </label>

      <label className="mt-5 grid gap-2 text-sm font-bold text-stone-800">
        Message
        <textarea
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          className="min-h-40 rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold leading-6 text-stone-950 outline-none transition focus:border-amber-500 focus:bg-white"
          placeholder="Share product, quantity, location or support details..."
        />
      </label>

      <button
        disabled={loading || !isReady}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? "Sending..." : "Send message"} <Send size={17} />
      </button>

      {status ? (
        <p className={`mt-5 flex items-start gap-2 rounded-2xl p-4 text-sm font-semibold ${sent ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
          {sent ? <Check className="mt-0.5 shrink-0" size={16} /> : null}
          {status}
        </p>
      ) : null}
    </form>
  );
}
