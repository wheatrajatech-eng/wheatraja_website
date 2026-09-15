"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Reminder = {
  id: number;
  kind: "reorder" | "subscription_renewal" | string;
  status: "queued" | "sent" | "failed" | string;
  reminder_at: string;
  sent_at?: string | null;
  order_id?: number | null;
  subscription_id?: number | null;
  payload?: { order_id?: string; estimated_days?: number; reminder_days?: number; cadence?: string; lead_days?: number; message?: string };
};

export function AccountRemindersClient() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`${apiBase}/reminders`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load reminders");
      setItems(await response.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const queuedCount = useMemo(() => items.filter((item) => item.status === "queued").length, [items]);
  const sentCount = useMemo(() => items.filter((item) => item.status === "sent").length, [items]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-[14px] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[.18em] text-amber-700">Reminder engine</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-950">Order refill and subscription reminders</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Reorder reminders are estimated from your last order mix. Subscription reminders are tied to the next delivery date. When available, the same alert also goes out by email and WhatsApp.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Total reminders", String(items.length)],
          ["Queued", String(queuedCount)],
          ["Sent", String(sentCount)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[14px] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.18em] text-stone-400">{label}</p>
            <p className="mt-2 font-serif text-4xl text-stone-950">{value}</p>
          </div>
        ))}
      </div>

      {state === "loading" ? <p className="rounded-[14px] bg-white p-5 text-sm font-semibold text-stone-500">Loading reminders...</p> : null}
      {state === "error" ? <p className="rounded-[14px] bg-white p-5 text-sm font-semibold text-red-700">Reminders are unavailable right now.</p> : null}

      {state === "ready" && !items.length ? (
        <div className="rounded-[14px] bg-white p-8 text-center shadow-sm">
          <Bell className="mx-auto text-amber-700" size={34} />
          <h3 className="mt-4 text-2xl font-black text-stone-950">No reminders yet</h3>
          <p className="mt-2 text-stone-600">Your future reorder reminders and subscription reminders will appear here automatically, and we’ll also try to notify you outside the dashboard by email or WhatsApp.</p>
        </div>
      ) : null}

      {state === "ready" && items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-[14px] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-amber-700">{item.kind.replaceAll("_", " ")}</p>
                  <h3 className="mt-2 font-serif text-2xl text-stone-950">
                    {item.kind === "subscription_renewal" ? "Subscription renewal reminder" : "Time to reorder fresh atta"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {item.payload?.message ?? "A reminder has been scheduled from your ordering pattern."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-stone-500">
                    <span className="rounded-full bg-stone-100 px-3 py-1.5">Reminder: {new Date(item.reminder_at).toLocaleString()}</span>
                    {item.sent_at ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">Sent: {new Date(item.sent_at).toLocaleString()}</span> : null}
                    {item.order_id ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">Order #{item.order_id}</span> : null}
                    {item.subscription_id ? <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">Subscription #{item.subscription_id}</span> : null}
                  </div>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-black ${item.status === "sent" ? "bg-emerald-100 text-emerald-700" : item.status === "queued" ? "bg-amber-100 text-amber-800" : item.status === "processing" ? "bg-sky-100 text-sky-700" : "bg-red-100 text-red-700"}`}>
                  {item.status}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
