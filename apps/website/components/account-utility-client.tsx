"use client";

import { useEffect, useState } from "react";
import { csrfHeaders } from "@/lib/csrf";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export function AccountUtilityClient({ mode }: { mode: "profile" | "addresses" | "refer" | "subscriptions" }) {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("201301");
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  useEffect(() => {
    const path = mode === "profile" ? "/auth/me" : mode === "addresses" ? "/users/addresses" : mode === "refer" ? "/referrals" : "/subscriptions";
    fetch(`${apiBase}${path}`, { credentials: "include", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        setData(value);
        if (mode === "profile" && value) {
          setName(value.name ?? "");
          setEmail(value.email ?? "");
        }
      })
      .catch(() => setStatus("Could not load account data."));
  }, [mode]);

  async function saveProfile() {
    const response = await fetch(`${apiBase}/users/me`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ name, email }) });
    setStatus(response.ok ? "Profile saved" : "Could not save profile");
  }

  async function saveAddress() {
    const response = await fetch(`${apiBase}/users/addresses`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ label: "Home", line1: address, pincode }) });
    setStatus(response.ok ? "Address saved" : "Could not save address");
    if (response.ok) setData([...(Array.isArray(data) ? data : []), await response.json()]);
  }

  async function updateSubscription(id: number, statusValue: "active" | "paused" | "cancelled") {
    const response = await fetch(`${apiBase}/subscriptions/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ status: statusValue }) });
    setStatus(response.ok ? `Subscription ${statusValue}` : "Could not update subscription");
    if (response.ok) {
      const updated = await response.json();
      setData((Array.isArray(data) ? data : []).map((row: any) => (row.id === id ? updated : row)));
    }
  }

  async function patchSubscription(id: number, body: Record<string, unknown>, success: string) {
    const response = await fetch(`${apiBase}/subscriptions/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify(body) });
    setStatus(response.ok ? success : "Could not update subscription");
    if (response.ok) {
      const updated = await response.json();
      setData((Array.isArray(data) ? data : []).map((row: any) => (row.id === id ? updated : row)));
    }
  }

  async function skipSubscription(id: number) {
    const response = await fetch(`${apiBase}/subscriptions/${id}/skip`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ note: "Skipped from account dashboard" }) });
    setStatus(response.ok ? "Next delivery skipped" : "Could not skip delivery");
    if (response.ok) {
      const updated = await response.json();
      setData((Array.isArray(data) ? data : []).map((row: any) => (row.id === id ? updated : row)));
    }
  }

  async function vacationHold(id: number) {
    if (!vacationStart || !vacationEnd) {
      setStatus("Select vacation start and end dates");
      return;
    }
    const response = await fetch(`${apiBase}/subscriptions/${id}/vacation`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ start_date: vacationStart, end_date: vacationEnd, note: "Vacation hold" })
    });
    setStatus(response.ok ? "Vacation hold applied" : "Could not apply vacation hold");
    if (response.ok) {
      const updated = await response.json();
      setData((Array.isArray(data) ? data : []).map((row: any) => (row.id === id ? updated : row)));
    }
  }

  const statusNode = status ? <p className="rounded-[10px] bg-[#F0E6CE] p-3 text-sm font-bold text-[#3A2A18]">{status}</p> : null;

  if (mode === "profile") {
    return (
      <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="account-card mx-auto grid max-w-3xl gap-4 rounded-[14px] p-6">
          <h2 className="font-serif text-3xl text-[#1A120A]">Profile settings</h2>
          <input value={name} onChange={(event) => setName(event.target.value)} className="account-input rounded-[10px] px-4 py-3" placeholder="Name" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="account-input rounded-[10px] px-4 py-3" placeholder="Email" />
          <button onClick={saveProfile} className="rounded-[10px] bg-[#3A6644] px-5 py-3 font-bold text-white">Save Profile</button>
          {statusNode}
        </div>
      </section>
    );
  }

  if (mode === "addresses") {
    return (
      <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="mx-auto grid max-w-4xl gap-4">
          <div className="account-card grid gap-4 rounded-[14px] p-6">
            <h2 className="font-serif text-3xl text-[#1A120A]">Delivery addresses</h2>
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="account-input min-h-24 rounded-[10px] px-4 py-3" placeholder="House, society, sector" />
            <input value={pincode} onChange={(event) => setPincode(event.target.value)} className="account-input rounded-[10px] px-4 py-3" placeholder="Pincode" />
            <button onClick={saveAddress} className="rounded-[10px] bg-[#3A6644] px-5 py-3 font-bold text-white">Save Address</button>
            {statusNode}
          </div>
          {(Array.isArray(data) ? data : []).map((row: any) => <p key={row.id} className="account-card rounded-[12px] p-4 text-[#1A120A]">{row.label}: {row.line1}, {row.pincode}</p>)}
        </div>
      </section>
    );
  }

  if (mode === "refer") {
    return (
      <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <div className="account-card mx-auto max-w-3xl rounded-[14px] p-8">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#B8780C]">Your referral code</p>
          <p className="mt-3 font-serif text-6xl text-[#1A120A]">{data?.code ?? "----"}</p>
          <p className="mt-3 text-[#6F624F]">Both users earn wallet credit after the referred user's first paid order.</p>
        </div>
      </section>
    );
  }

  const subscriptions = Array.isArray(data) ? data : [];
  return (
    <section className="account-shell min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
      <div className="mx-auto grid max-w-5xl gap-4">
        {statusNode}
        {subscriptions.length ? subscriptions.map((row: any) => (
          <article key={row.id} className="account-card rounded-[14px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-[#B8780C]">Subscription #{row.id}</p>
                <p className="mt-2 font-serif text-3xl text-[#1A120A]">{row.name} {row.weight_kg} KG x {row.quantity ?? 1}</p>
                <p className="mt-2 text-sm text-[#6F624F]">{row.cadence === "15_days" ? "Every 15 days" : "Every 30 days"} / {row.status ?? (row.active ? "active" : "paused")} / next {row.next_delivery_at ? new Date(row.next_delivery_at).toLocaleDateString() : "not scheduled"}</p>
              </div>
              <p className="rounded-full bg-[#F0E6CE] px-4 py-2 text-sm font-black text-[#3A2A18]">Wallet auto-deduct {row.wallet_auto_deduct ? "on" : "off"}</p>
            </div>
            <p className="mt-4 text-sm font-bold text-[#3A6644]">Plan amount: Rs {Math.round(row.amount ?? 0)}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_1fr_auto]">
              <input type="number" min={1} max={20} defaultValue={row.quantity ?? 1} onBlur={(event) => patchSubscription(row.id, { quantity: Number(event.target.value || 1) }, "Quantity updated")} className="account-input rounded-[10px] px-4 py-2 text-sm" />
              <input type="date" value={vacationStart} onChange={(event) => setVacationStart(event.target.value)} className="account-input rounded-[10px] px-4 py-2 text-sm" />
              <input type="date" value={vacationEnd} onChange={(event) => setVacationEnd(event.target.value)} className="account-input rounded-[10px] px-4 py-2 text-sm" />
              <button onClick={() => vacationHold(row.id)} className="rounded-[10px] bg-[#3A6644] px-4 py-2 text-sm font-bold text-white">Vacation</button>
            </div>
            {Array.isArray(row.deliveries) && row.deliveries.length ? (
              <div className="mt-4 grid gap-2">
                {row.deliveries.slice(0, 4).map((delivery: any) => (
                  <p key={delivery.id} className="rounded-[10px] bg-[#F0E6CE] px-4 py-3 text-sm text-[#3A2A18]">
                    {new Date(delivery.scheduled_for).toLocaleDateString()} / {delivery.status} / wallet Rs {Math.round(delivery.wallet_amount ?? 0)} / due Rs {Math.round(delivery.payable_amount ?? 0)}
                  </p>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => updateSubscription(row.id, "active")} className="rounded-[10px] bg-[#3A6644] px-4 py-2 text-sm font-bold text-white">Resume</button>
              <button onClick={() => updateSubscription(row.id, "paused")} className="rounded-[10px] bg-[#F0E6CE] px-4 py-2 text-sm font-bold text-[#3A2A18]">Pause</button>
              <button onClick={() => skipSubscription(row.id)} className="rounded-[10px] bg-[#D4960E] px-4 py-2 text-sm font-bold text-[#1A120A]">Skip Next</button>
              <button onClick={() => patchSubscription(row.id, { wallet_auto_deduct: !row.wallet_auto_deduct }, "Wallet auto-deduct updated")} className="rounded-[10px] bg-[#F0E6CE] px-4 py-2 text-sm font-bold text-[#3A2A18]">{row.wallet_auto_deduct ? "Disable Auto-pay" : "Enable Auto-pay"}</button>
              <button onClick={() => updateSubscription(row.id, "cancelled")} className="rounded-[10px] bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Cancel</button>
            </div>
          </article>
        )) : <p className="account-card rounded-[14px] p-6 text-[#6F624F]">No backend subscriptions yet.</p>}
      </div>
    </section>
  );
}
