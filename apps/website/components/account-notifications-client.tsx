"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/csrf";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Notification = {
  id: number;
  title: string;
  body: string;
  channel: string;
  read: boolean;
  created_at?: string | null;
};

export function AccountNotificationsClient() {
  const [items, setItems] = useState<Notification[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`${apiBase}/notifications`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load notifications");
      setItems(await response.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }

  async function markRead(id: number) {
    const response = await fetch(`${apiBase}/notifications/${id}/read`, { method: "PATCH", credentials: "include", headers: csrfHeaders() });
    if (response.ok) setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  async function markUnread(id: number) {
    const response = await fetch(`${apiBase}/notifications/${id}/unread`, { method: "PATCH", credentials: "include", headers: csrfHeaders() });
    if (response.ok) setItems((current) => current.map((item) => (item.id === id ? { ...item, read: false } : item)));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {state === "loading" ? <p className="account-card rounded-[14px] p-5 text-sm font-semibold text-[#6F624F]">Loading notifications...</p> : null}
      {state === "error" ? <p className="account-card rounded-[14px] p-5 text-sm font-semibold text-red-700">Notifications are unavailable right now.</p> : null}
      {state === "ready" && !items.length ? (
        <div className="account-card rounded-[14px] p-8 text-center">
          <Bell className="mx-auto text-[#B8780C]" size={34} />
          <h2 className="mt-4 text-2xl font-black text-[#1A120A]">No notifications yet</h2>
          <p className="mt-2 text-[#6F624F]">Order, refund, return and admin updates will appear here.</p>
        </div>
      ) : null}
      {state === "ready" && items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className={`account-card rounded-[14px] p-5 ${item.read ? "opacity-75" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[#B8780C]">{item.channel}</p>
                  <h2 className="mt-2 text-xl font-black text-[#1A120A]">{item.title}</h2>
                  <p className="mt-2 leading-7 text-[#6F624F]">{item.body}</p>
                  {item.created_at ? <p className="mt-3 text-xs font-bold text-[#8A7C66]">{new Date(item.created_at).toLocaleString()}</p> : null}
                </div>
                <button onClick={() => item.read ? markUnread(item.id) : markRead(item.id)} className="inline-flex items-center gap-2 rounded-[10px] bg-[#3A6644] px-4 py-3 text-sm font-black text-white">
                  <CheckCircle2 size={16} />
                  {item.read ? "Mark unread" : "Mark read"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
