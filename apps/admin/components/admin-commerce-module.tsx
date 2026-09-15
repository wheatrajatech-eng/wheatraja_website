"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "../../shared/api-client";
import type { AdminModuleKey } from "@/lib/admin-config";

const api = createApiClient();
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Row = Record<string, unknown>;
type CommerceKey = Extract<AdminModuleKey, "products" | "orders" | "inventory" | "returns" | "refunds" | "shipments" | "customers" | "payments" | "banners" | "blogs">;

const config: Record<CommerceKey, { endpoint: string; title: string; filters: string[]; sort: string; columns: string[] }> = {
  products: { endpoint: "/admin/products", title: "Product operations", filters: ["active"], sort: "name", columns: ["slug", "name", "active", "variants", "images"] },
  orders: { endpoint: "/admin/orders", title: "Order operations", filters: ["status", "payment_status"], sort: "created_at", columns: ["id", "phone", "status", "payment_status", "total", "created_at"] },
  inventory: { endpoint: "/inventory", title: "Inventory operations", filters: ["product", "available"], sort: "product", columns: ["variant_id", "product", "slug", "weight_kg", "available", "reserved"] },
  returns: { endpoint: "/admin/returns", title: "Return operations", filters: ["status"], sort: "created_at", columns: ["id", "order_id", "customer", "reason", "status", "created_at"] },
  refunds: { endpoint: "/admin/refunds", title: "Refund operations", filters: ["status"], sort: "created_at", columns: ["id", "order_id", "payment_id", "amount", "status", "reason", "created_at"] },
  shipments: { endpoint: "/admin/shipments", title: "Shipment operations", filters: ["status", "provider"], sort: "created_at", columns: ["id", "order_id", "provider", "tracking_number", "status", "estimated_delivery_at", "delivered_at"] },
  customers: { endpoint: "/admin/customers", title: "Customer operations", filters: ["role"], sort: "phone", columns: ["id", "phone", "name", "role", "referral_code"] },
  payments: { endpoint: "/admin/payments", title: "Payment operations", filters: ["status", "provider"], sort: "created_at", columns: ["id", "order_id", "provider", "method", "transaction_reference", "amount", "status", "created_at"] },
  banners: { endpoint: "/admin/banners", title: "Banner operations", filters: ["active"], sort: "display_order", columns: ["id", "title", "subtitle", "cta_text", "link_url", "display_order", "active"] },
  blogs: { endpoint: "/admin/blogs", title: "Blog operations", filters: ["published", "category"], sort: "created_at", columns: ["id", "slug", "title", "category", "published", "created_at"] }
};

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalize(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload as Row[];
  if (!payload || typeof payload !== "object") return [];
  return [payload as Row];
}

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(document.cookie.split("; ").find((row) => row.startsWith("wr_csrf="))?.split("=")[1] ?? "");
}

function ActionFields({ module, selected, onDone }: { module: CommerceKey; selected: Row | null; onDone: () => Promise<void> }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  useEffect(() => {
    setForm(selected && ["customers", "banners", "inventory", "products"].includes(module)
      ? Object.fromEntries(Object.entries(selected).filter(([, value]) => value !== null && typeof value !== "object").map(([key, value]) => [key, String(value)]))
      : {});
    setMessage("");
  }, [module, selected]);

  const fields = useMemo(() => {
    if (module === "products") return selected ? ["name", "description", "active", "featured", "category_slug", "seo_title", "seo_description", "variant_weight_kg", "variant_sku", "variant_mrp", "variant_price", "variant_discount_percent", "variant_low_stock_threshold", "variant_inventory", "image_url"] : ["slug", "name", "description", "active", "featured", "category_slug", "seo_title", "seo_description", "variant_weight_kg", "variant_sku", "variant_mrp", "variant_price", "variant_discount_percent", "variant_low_stock_threshold", "variant_inventory", "image_url"];
    if (module === "orders") return selected ? ["status", "refund_amount", "refund_reason"] : ["phone", "name", "email", "shipping_address", "slug", "weight_kg", "quantity", "price_override", "discount", "shipping_charge", "payment_method", "payment_status", "amount_received", "transaction_reference", "source_channel", "source_detail", "admin_notes", "expected_delivery_at"];
    if (module === "inventory") return ["available", "reserved", "reason"];
    if (module === "returns") return ["status", "resolution_note", "restock"];
    if (module === "refunds") return ["order_id", "amount", "reason"];
    if (module === "shipments") return selected ? ["status", "location", "note"] : ["order_id", "provider", "tracking_number", "status", "estimated_delivery_at"];
    if (module === "customers") return ["phone", "name", "email", "blocked", "admin_notes"];
    if (module === "payments") return ["order_id", "method", "status", "amount_received", "transaction_reference", "payment_date", "note", "proof_url"];
    if (module === "banners") return selected ? ["title", "subtitle", "image_url", "cta_text", "link_url", "display_order", "active", "starts_at", "ends_at"] : ["title", "subtitle", "image_url", "cta_text", "link_url", "display_order", "active", "starts_at", "ends_at"];
    if (module === "blogs") return selected ? ["slug", "title", "excerpt", "body", "category", "read_time", "cover_image_url", "published", "seo_title", "seo_description"] : ["slug", "title", "excerpt", "body", "category", "read_time", "cover_image_url", "published", "seo_title", "seo_description"];
    return [];
  }, [module, selected]);

  if (!fields.length) return null;

  async function uploadImage(field: string, file: File | null) {
    if (!file) return;
    setUploadingField(field);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`${apiBase}/media/upload`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken() ? { "X-CSRF-Token": csrfToken() } : undefined,
        body
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Upload failed");
      setForm((current) => ({ ...current, [field]: payload.url }));
      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingField("");
    }
  }

  async function submit() {
    if (!selected && (module === "inventory" || module === "returns")) {
      setMessage("Select an existing record before saving changes.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      if (module === "products") {
        const slug = String(selected?.slug ?? form.slug);
        if (selected) {
          await api.patch(`/products/${slug}`, { name: form.name || undefined, description: form.description || undefined, active: form.active ? form.active === "true" : undefined, featured: form.featured ? form.featured === "true" : undefined, category_slug: form.category_slug || undefined, seo_title: form.seo_title || undefined, seo_description: form.seo_description || undefined });
        } else {
          await api.post("/products", {
            slug: form.slug,
            name: form.name,
            description: form.description,
            active: form.active !== "false",
            featured: form.featured === "true",
            category_slug: form.category_slug || null,
            seo_title: form.seo_title || null,
            seo_description: form.seo_description || null,
            variants: form.variant_weight_kg ? [{ weight_kg: Number(form.variant_weight_kg), sku: form.variant_sku || null, mrp: form.variant_mrp ? Number(form.variant_mrp) : null, price: Number(form.variant_price || 0), discount_percent: Number(form.variant_discount_percent || 0), low_stock_threshold: Number(form.variant_low_stock_threshold || 10), inventory: Number(form.variant_inventory || 0) }] : [],
            images: form.image_url ? [form.image_url] : []
          });
        }
        if (selected && form.variant_weight_kg) await api.post(`/products/${slug}/variants`, { weight_kg: Number(form.variant_weight_kg), sku: form.variant_sku || null, mrp: form.variant_mrp ? Number(form.variant_mrp) : null, price: Number(form.variant_price || 0), discount_percent: Number(form.variant_discount_percent || 0), low_stock_threshold: Number(form.variant_low_stock_threshold || 10), inventory: Number(form.variant_inventory || 0) });
        if (selected && form.image_url) await api.post(`/products/${slug}/images`, { url: form.image_url, alt: form.name || String(selected?.name || "") });
      }
      if (module === "orders") {
        if (selected) {
          const orderId = String(selected.id);
          if (form.status) await api.patch(`/orders/admin/${orderId}/status`, { status: form.status });
          if (form.refund_amount) await api.post(`/payments/admin/${orderId}/refund`, { amount: Number(form.refund_amount), reason: form.refund_reason || "Admin refund" });
        } else {
          await api.post("/orders/admin/manual", {
            phone: form.phone,
            name: form.name || null,
            email: form.email || null,
            shipping_address: form.shipping_address,
            items: [{ slug: form.slug, weight_kg: Number(form.weight_kg || 5), quantity: Number(form.quantity || 1), price_override: form.price_override ? Number(form.price_override) : null }],
            discount: Number(form.discount || 0),
            shipping_charge: Number(form.shipping_charge || 0),
            payment_method: form.payment_method || "cod",
            payment_status: form.payment_status || "pending",
            amount_received: Number(form.amount_received || 0),
            transaction_reference: form.transaction_reference || null,
            source_channel: form.source_channel || "manual_admin",
            source_detail: form.source_detail || null,
            admin_notes: form.admin_notes || null,
            expected_delivery_at: form.expected_delivery_at || null
          });
        }
      }
      if (module === "inventory" && selected) await api.patch(`/inventory/${selected.variant_id}`, { available: Number(form.available), reserved: Number(form.reserved || selected.reserved || 0), reason: form.reason || "admin_adjustment" });
      if (module === "returns" && selected) await api.patch(`/returns/admin/${selected.id}`, { status: form.status || "approved", resolution_note: form.resolution_note || null, restock: form.restock === "true" });
      if (module === "refunds") await api.post(`/payments/admin/${form.order_id || selected?.order_id}/refund`, { amount: Number(form.amount), reason: form.reason || "Admin refund" });
      if (module === "shipments") {
        if (selected) await api.post(`/shipments/admin/${selected.id}/events`, { status: form.status, location: form.location || null, note: form.note || null });
        else await api.post("/shipments/admin", { order_id: form.order_id, provider: form.provider || null, tracking_number: form.tracking_number || null, status: form.status || "packed", estimated_delivery_at: form.estimated_delivery_at || null });
      }
      if (module === "customers") await api.post("/users/admin/customers", { phone: form.phone, name: form.name || null, email: form.email || null, blocked: form.blocked === "true", admin_notes: form.admin_notes || null });
      if (module === "payments") await api.post(`/payments/admin/${form.order_id || selected?.order_id}/manual`, { method: form.method || "cod", status: form.status || "paid", amount_received: Number(form.amount_received || 0), transaction_reference: form.transaction_reference || null, payment_date: form.payment_date || null, note: form.note || null, proof_url: form.proof_url || null });
      if (module === "banners") {
        const body = { title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null, cta_text: form.cta_text || null, link_url: form.link_url || null, display_order: Number(form.display_order || 0), active: form.active !== "false", starts_at: form.starts_at || null, ends_at: form.ends_at || null };
        if (selected) await api.patch(`/banners/${selected.id}`, body);
        else await api.post("/banners", body);
      }
      if (module === "blogs") {
        const body = { slug: form.slug || selected?.slug, title: form.title, excerpt: form.excerpt, body: form.body, category: form.category || "Blog", read_time: form.read_time || "4 min read", cover_image_url: form.cover_image_url || null, published: form.published !== "false", seo_title: form.seo_title || null, seo_description: form.seo_description || null };
        if (selected) await api.patch(`/blogs/${selected.slug}`, body);
        else await api.post("/blogs", body);
      }
      setMessage("Saved. Audit trail updated where supported.");
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black">{selected ? "Selected record actions" : "Create / initiate"}</h2>
          <p className="mt-1 text-sm text-white/50">{module === "products" ? "Create, publish/unpublish, archive, update variants and add images." : "Status and lifecycle actions scoped to this module."}</p>
        </div>
        {message ? <p className="text-sm font-bold text-[#D4960E]">{message}</p> : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fields.map((field) => (
          <label key={field} className="grid gap-2 text-xs font-black uppercase tracking-[.14em] text-white/45">
            {field.replaceAll("_", " ")}
            <input value={form[field] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="admin-input rounded-[10px] px-3 py-3 text-sm font-semibold normal-case tracking-normal" />
            {["image_url", "cover_image_url", "proof_url"].includes(field) ? (
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploadingField === field}
                onChange={(event) => uploadImage(field, event.target.files?.[0] ?? null)}
                className="admin-input rounded-[10px] px-3 py-2 text-xs font-semibold normal-case tracking-normal"
              />
            ) : null}
          </label>
        ))}
      </div>
      <button onClick={submit} disabled={saving} className="mt-4 rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#17120A] disabled:opacity-50">{saving ? "Saving..." : "Run action"}</button>
    </section>
  );
}

export function AdminCommerceModule({ moduleKey }: { moduleKey: CommerceKey }) {
  const module = config[moduleKey];
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(module.sort);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const pageSize = 12;

  async function load() {
    setState("loading");
    try {
      const payload = await api.get<unknown>(module.endpoint, { cache: "no-store" });
      setRows(normalize(payload));
      setState("ready");
    } catch (error) {
      const detail = error instanceof ApiError && error.payload && typeof error.payload === "object" && "detail" in error.payload ? String((error.payload as { detail?: unknown }).detail) : "";
      setMessage(detail || "Unable to load module.");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    setSelected(null);
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  const filterValues = useMemo(() => {
    const values: Record<string, string[]> = {};
    module.filters.forEach((filter) => {
      values[filter] = Array.from(new Set(rows.map((row) => text(row[filter])).filter((value) => value !== "-"))).sort();
    });
    return values;
  }, [module.filters, rows]);

  const visible = useMemo(() => {
    const term = query.toLowerCase().trim();
    return rows
      .filter((row) => (term ? JSON.stringify(row).toLowerCase().includes(term) : true))
      .filter((row) => module.filters.every((filter) => !filters[filter] || text(row[filter]) === filters[filter]))
      .sort((a, b) => text(a[sort]).localeCompare(text(b[sort]), undefined, { numeric: true }));
  }, [filters, module.filters, query, rows, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const pageRows = visible.slice(page * pageSize, page * pageSize + pageSize);
  const exportEntity = moduleKey === "orders" || moduleKey === "products" || moduleKey === "customers" || moduleKey === "payments" || moduleKey === "inventory" ? moduleKey : null;

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">{moduleKey}</p>
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{module.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="max-w-3xl text-sm leading-6 text-white/58">Custom operational screen with filters, sorting, detail review and backend-connected actions.</p>
          {exportEntity ? <a href={`${apiBase}/admin/export/${exportEntity}`} className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white">Export CSV</a> : null}
          {moduleKey === "orders" ? <a href={`${apiBase}/admin/export/source-report`} className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white">Source report</a> : null}
        </div>
      </section>

      <ActionFields module={moduleKey} selected={selected} onDone={load} />

      <section className="admin-card overflow-hidden rounded-[14px]">
        <div className="grid gap-3 border-b border-white/10 p-5 xl:grid-cols-[1fr_auto]">
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search records..." className="admin-input rounded-[10px] px-4 py-3 text-sm" />
          <div className="flex flex-wrap gap-2">
            {module.filters.map((filter) => (
              <select key={filter} value={filters[filter] ?? ""} onChange={(event) => { setFilters((current) => ({ ...current, [filter]: event.target.value })); setPage(0); }} className="admin-input rounded-[10px] px-3 py-3 text-sm">
                <option value="">{filter.replaceAll("_", " ")}: all</option>
                {filterValues[filter]?.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            ))}
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="admin-input rounded-[10px] px-3 py-3 text-sm">
              {module.columns.map((column) => <option key={column} value={column}>Sort: {column.replaceAll("_", " ")}</option>)}
            </select>
            <button onClick={load} className="rounded-[10px] bg-white/10 px-4 py-3 text-sm font-black">Refresh</button>
          </div>
        </div>

        {state === "loading" ? <p className="p-6 text-sm font-semibold text-white/60">Loading records...</p> : null}
        {state === "error" ? <p className="p-6 text-sm font-semibold text-red-200">{message}</p> : null}
        {state === "ready" && !visible.length ? <p className="p-6 text-sm font-semibold text-white/60">No records match this view.</p> : null}
        {state === "ready" && visible.length ? (
          <>
            <div className="admin-scrollbar overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[.045] text-xs uppercase tracking-[.14em] text-white/45">
                  <tr>{module.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3">{column.replaceAll("_", " ")}</th>)}<th className="px-4 py-3">Detail</th></tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr key={index} className={selected === row ? "bg-[#D4960E]/12" : "odd:bg-white/[.025]"}>
                      {module.columns.map((column) => <td key={column} className="max-w-[260px] truncate border-t border-white/10 px-4 py-3 text-white/72">{text(row[column])}</td>)}
                      <td className="border-t border-white/10 px-4 py-3"><button onClick={() => setSelected(row)} className="rounded-[8px] border border-white/10 px-3 py-2 text-xs font-black">Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4 text-sm text-white/55">
              <span>{visible.length} records / page {page + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-[8px] border border-white/10 px-3 py-2 disabled:opacity-40">Prev</button>
                <button disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="rounded-[8px] border border-white/10 px-3 py-2 disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {selected ? (
        <section className="admin-card rounded-[14px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-black">Detail view</h2>
            <button onClick={() => setSelected(null)} className="rounded-[8px] bg-white/10 px-3 py-2 text-sm font-black">Clear selection</button>
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[10px] bg-black/25 p-4 text-xs leading-6 text-white/75">{JSON.stringify(selected, null, 2)}</pre>
        </section>
      ) : null}
    </div>
  );
}
