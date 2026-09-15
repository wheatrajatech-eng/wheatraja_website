"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, createApiClient } from "../../shared/api-client";

const api = createApiClient();
export type ManagementKey = "subscriptions" | "reviews" | "contact" | "users" | "support" | "recoveries" | "deliverySlots";
type Row = Record<string, unknown>;
type Field = { key: string; label: string; type?: string; options?: string[]; required?: boolean; min?: number; max?: number };
type Config = { title: string; endpoint: string; columns: string[]; create?: boolean; fields: Field[] };
const configurations: Record<ManagementKey, Config> = {
  subscriptions: { title: "Subscriptions", endpoint: "/subscriptions/admin/upcoming", columns: ["id", "phone", "name", "quantity", "status", "next_delivery_at"], create: true, fields: [
    { key: "quantity", label: "Quantity", type: "number", min: 1, max: 20, required: true },
    { key: "next_delivery_at", label: "Next delivery", type: "datetime-local", required: true },
    { key: "wallet_auto_deduct", label: "Use wallet automatically", type: "checkbox" },
  ] },
  reviews: { title: "Reviews", endpoint: "/admin/reviews", columns: ["id", "rating", "comment", "approved"], fields: [{ key: "approved", label: "Published / approved", type: "checkbox" }] },
  contact: { title: "Contact", endpoint: "/admin/contact", columns: ["id", "source", "name", "phone", "status"], fields: [{ key: "status", label: "Status", options: ["new", "in_progress", "resolved", "closed", "spam"], required: true }] },
  users: { title: "Users", endpoint: "/users/admin/accounts", columns: ["id", "phone", "name", "role", "blocked"], create: true, fields: [
    { key: "phone", label: "Phone", required: true }, { key: "name", label: "Name", required: true }, { key: "email", label: "Email", type: "email" },
    { key: "role", label: "Account type", options: ["customer", "admin"], required: true },
    { key: "blocked", label: "Block account", type: "checkbox" }, { key: "admin_notes", label: "Internal notes", type: "textarea" },
  ] },
  support: { title: "Support", endpoint: "/growth/admin/support", columns: ["ticket_number", "subject", "status", "priority"], fields: [
    { key: "status", label: "Status", options: ["open", "waiting_customer", "in_progress", "resolved", "closed"], required: true },
    { key: "priority", label: "Priority", options: ["low", "normal", "high", "urgent"], required: true },
    { key: "resolution_note", label: "Resolution / reply notes", type: "textarea" },
  ] },
  recoveries: { title: "Cart recoveries", endpoint: "/growth/admin/recoveries", columns: ["id", "phone", "email", "subtotal", "status", "last_reminder_at"], fields: [
    { key: "status", label: "Follow-up status", options: ["open", "reminded", "dismissed"], required: true },
    { key: "channel", label: "Follow-up channel", options: ["email", "whatsapp", "phone", "in_app"], required: true },
  ] },
  deliverySlots: { title: "Delivery slots", endpoint: "/admin/delivery-slots", columns: ["id", "zone", "starts_at", "capacity", "booked_count", "active"], create: true, fields: [
    { key: "zone", label: "Zone", required: true }, { key: "pincode", label: "Pincode" },
    { key: "starts_at", label: "Starts at", type: "datetime-local", required: true }, { key: "ends_at", label: "Ends at", type: "datetime-local", required: true },
    { key: "capacity", label: "Capacity", type: "number", min: 1, max: 500, required: true }, { key: "active", label: "Accept bookings", type: "checkbox" },
  ] },
};
function errorText(error: unknown) {
  if (error instanceof ApiError) {
    const detail = (error.payload as { detail?: unknown })?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(item => `${item.loc?.slice(1).join(".")}: ${item.msg}`).join("; ");
    return `Request failed (${error.status}). Please try again.`;
  }
  return "Connection failed. Please try again.";
}
function display(value: unknown) { return value === null || value === undefined ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value); }
type Mutation = { method: "post" | "patch" | "delete"; path: string; body?: unknown; label: string; message?: string };

export function AdminManagement({ module }: { module: ManagementKey }) {
  const config = configurations[module];
  const [rows, setRows] = useState<Row[]>([]);
  const [roles, setRoles] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [confirmation, setConfirmation] = useState<Mutation | null>(null);
  const [vacation, setVacation] = useState({ start_date: "", end_date: "" });
  async function load() {
    setLoading(true);
    try {
      setRows(await api.get<Row[]>(config.endpoint));
      if (module === "users") setRoles(await api.get<Row[]>("/admin/roles"));
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [module]); // eslint-disable-line react-hooks/exhaustive-deps
  function edit(row: Row | null) {
    setSelected(row);
    const defaults: Row = { quantity: 1, weight_kg: 5, cadence: "30_days", wallet_auto_deduct: true, role: "customer", active: true, capacity: 25, zone: "Noida Core", channel: "email" };
    const values = { ...defaults, ...row };
    if (row?.recovery_channel) values.channel = row.recovery_channel;
    setForm(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === null ? "" : Array.isArray(value) ? value.join(",") : String(value)])));
    setEditing(true);
    setError(""); setMessage(""); setVacation({ start_date: "", end_date: "" });
  }
  const fields = [...config.fields];
  if (module === "subscriptions") {
    if (!selected) fields.unshift({ key: "phone", label: "Customer phone", required: true }, { key: "slug", label: "Product slug", required: true }, { key: "weight_kg", label: "Weight (kg)", type: "number", min: 1, required: true }, { key: "cadence", label: "Frequency", options: ["30_days", "15_days"], required: true });
  }
  async function mutate(action: Mutation) {
    setBusy(true); setError(""); setMessage(""); setConfirmation(null);
    try {
      if (action.method === "delete") await api.delete(action.path);
      else await api[action.method](action.path, action.body);
      setMessage(action.message || `${action.label} completed.`);
      setEditing(false); setSelected(null); await load();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const body: Row = Object.fromEntries(fields.map(field => [field.key, field.type === "checkbox" ? form[field.key] === "true" : field.type === "number" ? Number(form[field.key]) : form[field.key] || null]));
    let path = "";
    if (module === "subscriptions") path = selected ? `/subscriptions/admin/${selected.id}` : "/subscriptions/admin";
    if (module === "reviews") path = `/reviews/${selected?.id}`;
    if (module === "contact") path = `/admin/contact/${selected?.source}/${selected?.id}?status=${encodeURIComponent(form.status)}`;
    if (module === "users") { path = "/users/admin/accounts"; body.role_ids = (form.role_ids || "").split(",").filter(Boolean).map(Number); }
    if (module === "support") path = `/growth/admin/support/${selected?.ticket_number}`;
    if (module === "recoveries") path = `/growth/admin/recoveries/${selected?.id}`;
    if (module === "deliverySlots") path = selected ? `/growth/admin/delivery-slots/${selected.id}` : "/growth/admin/delivery-slots";
    const action: Mutation = { method: !selected || module === "users" ? "post" : "patch", path, body, label: "Save" };
    if (module === "users") setConfirmation({ ...action, label: "Save account access" }); else mutate(action);
  }
  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 15));
  const currentPage = Math.min(page, pageCount - 1);
  return <div className="grid gap-5">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-black">{config.title}</h1><p className="mt-2 text-sm text-white/60">Search records, inspect details and manage their status.</p></div>
      {config.create ? <button onClick={() => edit(null)} disabled={busy} className="rounded-lg bg-[#D4960E] px-4 py-2 font-bold text-black">Create new</button> : null}
    </header>
    {error ? <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-100">{error}</p> : null}
    {message ? <p role="status" className="rounded-lg bg-emerald-950 p-4 text-emerald-100">{message}</p> : null}
    <section className="admin-card rounded-xl p-4">
      <div className="flex flex-wrap gap-3"><input aria-label="Search records" placeholder="Search records" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} className="admin-input flex-1 rounded-lg px-3 py-2" /><button onClick={() => { setError(""); load(); }} disabled={loading || busy} className="rounded-lg bg-white/10 px-4 py-2">Refresh</button></div>
      {loading ? <p role="status" className="py-6">Loading...</p> : <>
        {!filtered.length ? <p className="py-6 text-white/60">No matching records.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{config.columns.map(column => <th key={column} className="p-3 capitalize">{column.replaceAll("_", " ")}</th>)}<th className="p-3">Action</th></tr></thead><tbody>
          {filtered.slice(currentPage * 15, currentPage * 15 + 15).map(row => <tr key={`${row.source || ""}:${row.id}`} className="border-t border-white/10">{config.columns.map(column => <td key={column} className="max-w-xs break-words p-3">{display(row[column])}</td>)}<td className="p-3"><button onClick={() => edit(row)} disabled={busy} className="rounded-lg bg-white/10 px-3 py-2">Manage</button></td></tr>)}
        </tbody></table></div>}
        <div className="mt-4 flex flex-wrap items-center gap-3"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg bg-white/10 px-3 disabled:opacity-40">Previous</button><span>Page {currentPage + 1} of {pageCount} ({filtered.length} loaded records)</span><button disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg bg-white/10 px-3 disabled:opacity-40">Next</button></div>
      </>}
    </section>
    {editing ? <section className="admin-card rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{selected ? `Manage ${selected.ticket_number || selected.phone || selected.id}` : "Create record"}</h2><button onClick={() => setEditing(false)} disabled={busy} className="rounded-lg bg-white/10 px-4">Close editor</button></div>
      {selected ? <details className="mt-4"><summary className="cursor-pointer py-2">Record details</summary><pre className="max-h-72 whitespace-pre-wrap break-all rounded-lg bg-black/20 p-4 text-xs">{JSON.stringify(selected, null, 2)}</pre></details> : null}
      {module === "recoveries" ? <p className="mt-3 text-sm text-amber-100">Record a follow-up already made, dismiss a cart, or reopen it. Saving does not send a message.</p> : null}
      {module === "users" ? <p className="mt-3 text-sm text-white/60">Block an account to revoke access while preserving its order history. Staff roles control allowed actions.</p> : null}
      <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <fieldset disabled={busy} className="contents">{fields.map(field => <label key={field.key} className="grid content-start gap-2 text-sm font-bold">{field.label}
          {field.options ? <select aria-label={field.label} required={field.required} value={form[field.key] || ""} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className="admin-input rounded-lg p-3"><option value="">Select...</option>{field.options.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>
          : field.type === "textarea" ? <textarea aria-label={field.label} value={form[field.key] || ""} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className="admin-input min-h-24 rounded-lg p-3" />
          : field.type === "checkbox" ? <input aria-label={field.label} type="checkbox" checked={form[field.key] === "true"} onChange={e => setForm({ ...form, [field.key]: String(e.target.checked) })} className="h-6 w-6" />
          : <input aria-label={field.label} type={field.type || "text"} required={field.required} min={field.min} max={field.max} readOnly={module === "users" && !!selected && field.key === "phone"} value={field.type === "datetime-local" ? (form[field.key] || "").slice(0, 16) : form[field.key] || ""} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className="admin-input rounded-lg p-3" />}
        </label>)}
        {module === "users" ? <label className="grid gap-2 text-sm font-bold">Assigned roles<select aria-label="Assigned roles" multiple value={(form.role_ids || "").split(",")} onChange={e => setForm({ ...form, role_ids: Array.from(e.target.selectedOptions).map(option => option.value).join(",") })} className="admin-input min-h-32 rounded-lg p-3">{roles.map(role => <option key={String(role.id)} value={String(role.id)}>{String(role.name)}</option>)}</select></label> : null}
        <div className="sm:col-span-2"><button type="submit" className="rounded-lg bg-[#D4960E] px-5 py-3 font-bold text-black">{busy ? "Saving..." : selected ? "Save changes" : "Create record"}</button></div></fieldset>
      </form>
      {selected && module === "subscriptions" ? <div className="mt-5 grid gap-4 border-t border-white/10 pt-5">
        <div className="flex flex-wrap gap-2">{["active", "paused", "cancelled"].map(status => <button key={status} disabled={busy || selected.status === status} onClick={() => setConfirmation({ method: "patch", path: `/subscriptions/admin/${selected.id}`, body: { status }, label: status === "active" ? "Resume plan" : status === "paused" ? "Pause plan" : "Cancel plan" })} className="rounded-lg bg-white/10 px-4 py-2 disabled:opacity-40">{status === "active" ? "Resume" : status === "paused" ? "Pause" : "Cancel plan"}</button>)}
          <button disabled={busy || !selected.active} onClick={() => setConfirmation({ method: "post", path: `/subscriptions/admin/${selected.id}/skip`, body: {}, label: "Skip next delivery" })} className="rounded-lg bg-white/10 px-4">Skip next delivery</button>
          <button disabled={busy || !selected.active} onClick={() => setConfirmation({ method: "post", path: `/subscriptions/admin/${selected.id}/generate-cycle`, body: {}, label: "Generate order and apply wallet funds" })} className="rounded-lg bg-white/10 px-4">Generate cycle</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3"><label>Vacation start<input aria-label="Vacation start" type="datetime-local" value={vacation.start_date} onChange={e => setVacation({ ...vacation, start_date: e.target.value })} className="admin-input mt-2 w-full rounded-lg p-2" /></label><label>Vacation end<input aria-label="Vacation end" type="datetime-local" value={vacation.end_date} onChange={e => setVacation({ ...vacation, end_date: e.target.value })} className="admin-input mt-2 w-full rounded-lg p-2" /></label><button disabled={busy || !selected.active || !vacation.start_date || !vacation.end_date} onClick={() => mutate({ method: "post", path: `/subscriptions/admin/${selected.id}/vacation`, body: vacation, label: "Vacation hold" })} className="rounded-lg bg-white/10 px-4 disabled:opacity-40">Apply vacation</button></div>
      </div> : null}
      {selected && ["reviews", "contact", "deliverySlots"].includes(module) ? <button disabled={busy} onClick={() => setConfirmation({ method: "delete", path: module === "reviews" ? `/reviews/${selected.id}` : module === "contact" ? `/admin/contact/${selected.source}/${selected.id}` : `/growth/admin/delivery-slots/${selected.id}`, label: "Delete record permanently" })} className="mt-5 rounded-lg bg-red-950 px-4 py-3 font-bold text-red-100">Delete record</button> : null}
    </section> : null}
    {confirmation ? <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div className="admin-card w-full max-w-md rounded-xl p-6"><h2 id="confirm-title" className="text-xl font-bold">{confirmation.label}?</h2><p className="mt-3 text-sm text-white/70">This will update the selected record and its audit history.</p><div className="mt-5 flex flex-wrap gap-3"><button autoFocus onClick={() => setConfirmation(null)} className="rounded-lg bg-white/10 px-4 py-2">Go back</button><button onClick={() => mutate(confirmation)} className="rounded-lg bg-[#D4960E] px-4 py-2 font-bold text-black">Confirm</button></div></div></div> : null}
  </div>;
}
