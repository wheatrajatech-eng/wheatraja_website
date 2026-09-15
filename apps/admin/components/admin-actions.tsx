"use client";

import { useState } from "react";
import { ApiError, createApiClient } from "../../shared/api-client";
import type { AdminModuleKey } from "@/lib/admin-config";

const api = createApiClient();

function fieldsFor(module: AdminModuleKey) {
  if (module === "products") return ["slug", "name", "description", "category_slug"];
  if (module === "categories") return ["slug", "name", "description"];
  if (module === "orders") return ["order_id", "status"];
  if (module === "inventory") return ["variant_id", "available", "reserved", "reason"];
  if (module === "shipments") return ["order_id", "carrier", "tracking_number", "status", "event_note"];
  if (module === "returns") return ["return_id", "status", "resolution_note"];
  if (module === "coupons") return ["code", "percent_off", "active"];
  if (module === "settings") return ["key", "value"];
  if (module === "roles") return ["name", "description"];
  if (module === "notifications") return ["phone", "title", "body", "event_type", "channel"];
  if (module === "wallet") return ["phone", "amount", "reason"];
  if (module === "referrals") return ["referral_id"];
  return [];
}

function actionFor(module: AdminModuleKey, form: Record<string, string>) {
  if (module === "products") return { path: "/products", body: { slug: form.slug, name: form.name, description: form.description, category_slug: form.category_slug || null } };
  if (module === "categories") return { path: "/categories", body: { slug: form.slug, name: form.name, description: form.description || null } };
  if (module === "orders") return { path: `/orders/admin/${form.order_id}/status`, body: { status: form.status }, method: "PATCH" as const };
  if (module === "inventory") return { path: `/inventory/${form.variant_id}`, body: { available: Number(form.available || 0), reserved: Number(form.reserved || 0), reason: form.reason || "admin_adjustment" }, method: "PATCH" as const };
  if (module === "shipments") return { path: "/shipments/admin", body: { order_id: Number(form.order_id), carrier: form.carrier, tracking_number: form.tracking_number, status: form.status || "packed", event_note: form.event_note || null } };
  if (module === "returns") return { path: `/returns/admin/${form.return_id}`, body: { status: form.status, resolution_note: form.resolution_note || null }, method: "PATCH" as const };
  if (module === "coupons") return { path: "/coupons", body: { code: form.code, percent_off: Number(form.percent_off), active: form.active !== "false" } };
  if (module === "settings") return { path: "/settings", body: { key: form.key, value: form.value } };
  if (module === "roles") return { path: "/admin/roles", body: { name: form.name, description: form.description || null } };
  if (module === "notifications") return { path: "/notifications/admin/send", body: { phone: form.phone || null, title: form.title, body: form.body, event_type: form.event_type || "admin_message", channel: form.channel || "in_app" } };
  if (module === "wallet") return { path: "/admin/wallet-adjust", body: { phone: form.phone, amount: Number(form.amount || 0), reason: form.reason || "Admin adjustment" } };
  if (module === "referrals") return { path: `/admin/referrals/${form.referral_id}/reward`, body: {} };
  return null;
}

export function AdminActions({ module, onDone }: { module: AdminModuleKey; onDone: () => Promise<void> }) {
  const fields = fieldsFor(module);
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!fields.length) return null;

  async function submit() {
    const action = actionFor(module, form);
    if (!action) return;
    setSaving(true);
    setMessage("");
    try {
      if (action.method === "PATCH") await api.patch(action.path, action.body);
      else await api.post(action.path, action.body);
      setMessage("Saved.");
      setForm({});
      await onDone();
    } catch (error) {
      const detail = error instanceof ApiError && error.payload && typeof error.payload === "object" && "detail" in error.payload ? String((error.payload as { detail?: unknown }).detail) : "";
      setMessage(detail || "Action failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-action-card rounded-[14px] p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">Quick action</h2>
          <p className="mt-1 text-sm text-white/50">Scoped operation for this module.</p>
        </div>
        {message ? <p className="text-sm font-bold text-[#D4960E]">{message}</p> : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fields.map((field) => (
          <label key={field} className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">
            {field.replaceAll("_", " ")}
            <input value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="admin-input rounded-[10px] px-3 py-3 text-sm font-semibold normal-case tracking-normal" />
          </label>
        ))}
      </div>
      <button onClick={submit} disabled={saving} className="mt-4 rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#17120A] disabled:opacity-55">{saving ? "Saving..." : "Submit action"}</button>
    </section>
  );
}
