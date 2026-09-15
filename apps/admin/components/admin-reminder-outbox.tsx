"use client";

import { CheckCircle2, Inbox, RefreshCw, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type OutboxRow = {
  id: number;
  reminder_schedule_id: number;
  schedule_key?: string | null;
  user_id: number;
  customer_phone?: string | null;
  customer_email?: string | null;
  order_id?: number | null;
  subscription_id?: number | null;
  kind?: string | null;
  channel: "email" | "whatsapp" | string;
  event_type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  status: "queued" | "sent" | "failed" | "processing" | string;
  attempts: number;
  available_at?: string | null;
  last_attempt_at?: string | null;
  sent_at?: string | null;
  provider_message_id?: string | null;
  last_error?: string | null;
  created_at?: string | null;
};

type TimelineEntry = {
  at?: string | null;
  source: string;
  label: string;
  status?: string | null;
  channel?: string | null;
  details?: Record<string, unknown>;
};

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(document.cookie.split("; ").find((row) => row.startsWith("wr_csrf="))?.split("=")[1] ?? "");
}

function badgeTone(status: string) {
  if (status === "sent") return "bg-emerald-100 text-emerald-700";
  if (status === "queued") return "bg-amber-100 text-amber-800";
  if (status === "processing") return "bg-sky-100 text-sky-700";
  return "bg-red-100 text-red-700";
}

function formatValue(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function payloadText(value: Record<string, unknown> | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

type AdminReminderOutboxProps = {
  pageMode?: "all" | "failed";
};

export function AdminReminderOutbox({ pageMode = "all" }: AdminReminderOutboxProps) {
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [statusFilter, setStatusFilter] = useState(pageMode === "failed" ? "failed" : "");
  const [channelFilter, setChannelFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "severe">("all");
  const [exportScope, setExportScope] = useState<"severe" | "visible">("severe");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<OutboxRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineMessage, setTimelineMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bulkRetryBusy, setBulkRetryBusy] = useState(false);
  const failedOnlyLocked = pageMode === "failed";

  async function load() {
    setState("loading");
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (channelFilter) params.set("channel", channelFilter);
      params.set("limit", "250");
      const response = await fetch(`${apiBase}/reminders/admin/outbox?${params.toString()}`, { credentials: "include", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Unable to load reminder outbox");
      setRows(Array.isArray(payload) ? payload : []);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load reminder outbox");
      setState("error");
    }
  }

  async function loadTimeline(rowId: number) {
    setTimelineLoading(true);
    setTimelineMessage("");
    try {
      const response = await fetch(`${apiBase}/reminders/admin/outbox/${rowId}/timeline`, { credentials: "include", cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Unable to load reminder timeline");
      setTimeline(Array.isArray(payload?.timeline) ? payload.timeline : []);
    } catch (error) {
      setTimeline([]);
      setTimelineMessage(error instanceof Error ? error.message : "Unable to load reminder timeline");
    } finally {
      setTimelineLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      load().catch(() => null);
    }, 20000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    if (!selected) {
      setTimeline([]);
      setTimelineMessage("");
      return;
    }
    loadTimeline(selected.id).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!term) return true;
      return JSON.stringify(row).toLowerCase().includes(term);
    });
  }, [query, rows]);

  const visibleRows = useMemo(() => {
    if (pageMode !== "failed" || severityFilter === "all") return filteredRows;
    return filteredRows.filter((row) => Number(row.attempts || 0) > 3);
  }, [filteredRows, pageMode, severityFilter]);

  const severeRows = filteredRows.filter((row) => row.status === "failed" && Number(row.attempts) > 3);
  const exportRows = exportScope === "severe" ? severeRows : visibleRows;

  const summary = useMemo(() => ({
    total: rows.length,
    queued: rows.filter((row) => row.status === "queued").length,
    processing: rows.filter((row) => row.status === "processing").length,
    failed: rows.filter((row) => row.status === "failed").length,
    sent: rows.filter((row) => row.status === "sent").length
  }), [rows]);

  async function retryRow(row: OutboxRow) {
    setBusyId(row.id);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/reminders/admin/outbox/${row.id}/retry`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken() ? { "X-CSRF-Token": csrfToken() } : undefined
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Retry failed");
      await load();
      setSelected((current) => (current?.id === row.id ? payload : current));
      setMessage("Row queued for retry.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Retry failed");
    } finally {
      setBusyId(null);
    }
  }

  async function processQueued() {
    setBusyId(-1);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/reminders/admin/process-outbox`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken() ? { "X-CSRF-Token": csrfToken() } : undefined
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Outbox processing failed");
      await load();
      setMessage(`Processed ${payload.sent ?? 0} outbox row(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Outbox processing failed");
    } finally {
      setBusyId(null);
    }
  }

  async function retryAllFailed() {
    setBulkRetryBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/reminders/admin/outbox/retry-failed`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken() ? { "X-CSRF-Token": csrfToken() } : undefined
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Bulk retry failed");
      await load();
      setMessage(`Queued ${payload.retried ?? 0} failed row(s) for retry.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk retry failed");
    } finally {
      setBulkRetryBusy(false);
    }
  }

  const failedOnlyActive = failedOnlyLocked || (statusFilter === "failed" && !channelFilter);

  function csvEscape(value: unknown) {
    const text = value === null || value === undefined ? "" : String(value);
    // Keep customer-provided values from becoming spreadsheet formulas.
    const safeText = /^[\s]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    if (state !== "ready" || !exportRows.length) return;
    const header = ["id", "phone", "email", "channel", "status", "attempts", "kind", "order_id", "subscription_id", "available_at", "last_attempt_at", "sent_at", "provider_message_id", "last_error", "schedule_key", "event_type", "title"];
    const lines = [
      header.join(","),
      ...exportRows.map((row) =>
        [
          row.id,
          row.customer_phone,
          row.customer_email,
          row.channel,
          row.status,
          row.attempts,
          row.kind,
          row.order_id,
          row.subscription_id,
          row.available_at,
          row.last_attempt_at,
          row.sent_at,
          row.provider_message_id,
          row.last_error,
          row.schedule_key,
          row.event_type,
          row.title
        ].map(csvEscape).join(",")
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wheatraja-reminder-failures-${exportScope}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <section>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Deliverability</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Reminder outbox</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
            {pageMode === "failed"
              ? "Dedicated failure queue for triage, resend history, and one-click bulk retry when WhatsApp or email delivery needs attention."
              : "Watch queued reminder deliveries, inspect the exact message payload before send, and retry failed email or WhatsApp sends from one place."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/reminder-outbox" className={`rounded-[10px] px-4 py-2 text-sm font-black transition ${pageMode === "all" ? "bg-[#D4960E] text-[#17120A]" : "bg-white/10 text-white hover:bg-white/15"}`}>
              All outbox
            </Link>
            <Link href="/reminder-outbox/failed" className={`rounded-[10px] px-4 py-2 text-sm font-black transition ${pageMode === "failed" ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/15"}`}>
              Failed only
            </Link>
            {pageMode === "failed" ? (
              <>
                <select aria-label="CSV export scope" value={exportScope} onChange={(event) => setExportScope(event.target.value as "severe" | "visible")} className="rounded-[10px] border border-white/10 bg-[#17120A] px-3 py-2 text-sm text-white">
                  <option value="severe">CSV: Attempts &gt; 3</option>
                  <option value="visible">CSV: Current view</option>
                </select>
                <button onClick={exportCsv} disabled={state !== "ready" || !exportRows.length} className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:opacity-50">
                  Export CSV ({exportRows.length})
                </button>
              </>
            ) : null}
          </div>
          {pageMode === "failed" ? (
            <p className="mt-3 text-xs text-white/55">Counts and CSV cover up to 250 loaded rows matching your channel and search. CSV defaults to failed deliveries with more than 3 attempts.</p>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Total", summary.total],
            ["Queued", summary.queued],
            ["Processing", summary.processing],
            ["Failed", summary.failed],
            ["Sent", summary.sent]
          ].map(([label, value]) => (
            <div key={String(label)} className="admin-card rounded-[14px] p-5">
              <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">{label}</p>
              <p className="mt-3 text-3xl font-black text-white">{String(value)}</p>
            </div>
          ))}
        </section>

        <section className="admin-card rounded-[14px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Inbox size={18} className="text-[#D4960E]" />
                <h2 className="text-xl font-black text-white">Live queue</h2>
              </div>
              <p className="mt-1 text-sm text-white/55">Auto-refreshes every 20 seconds. Use filters to focus on queued rows or failures, then inspect the exact send timeline for any row.</p>
            </div>
            {message ? <p className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-semibold text-white/75">{message}</p> : null}
          </div>

          <div className={`mt-4 grid gap-3 ${failedOnlyLocked ? "lg:grid-cols-[1fr_auto_auto_auto_auto]" : "lg:grid-cols-[1fr_auto_auto_auto_auto]"}`}>
            <label className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[.055] px-3 py-2 text-sm text-white/65">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, payload, order or status..." className="w-full bg-transparent text-white outline-none placeholder:text-white/35" />
            </label>
            {!failedOnlyLocked ? (
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-[10px] border border-white/10 bg-white/[.055] px-3 py-2 text-sm text-white outline-none">
                <option value="">All statuses</option>
                <option value="queued">Queued</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="sent">Sent</option>
              </select>
            ) : (
              <div className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100">
                Locked to failed rows
              </div>
            )}
            <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} className="rounded-[10px] border border-white/10 bg-white/[.055] px-3 py-2 text-sm text-white outline-none">
              <option value="">All channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            {!failedOnlyLocked ? (
              <button
                onClick={() => setStatusFilter((current) => (current === "failed" ? "" : "failed"))}
                className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm font-black transition ${failedOnlyActive ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/15"}`}
              >
                <TriangleAlert size={16} />
                {failedOnlyActive ? "Show all" : "Failed only"}
              </button>
            ) : null}
            {pageMode === "failed" ? (
              <button
                onClick={() => setSeverityFilter((current) => (current === "all" ? "severe" : "all"))}
                aria-pressed={severityFilter === "severe"}
                className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm font-black transition ${severityFilter === "severe" ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/15"}`}
              >
                <TriangleAlert size={16} />
                {severityFilter === "severe" ? "All failed" : "Attempts > 3"}
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs" aria-label={`${severeRows.length} severe failures`}>{severeRows.length}</span>
              </button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
                <RefreshCw size={16} />
                Refresh
              </button>
              <button onClick={retryAllFailed} disabled={bulkRetryBusy || !summary.failed} className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15 disabled:opacity-50">
                <CheckCircle2 size={16} />
                {bulkRetryBusy ? "Retrying..." : "Retry all failed"}
              </button>
              <button onClick={processQueued} disabled={busyId === -1} className="inline-flex items-center gap-2 rounded-[10px] bg-[#D4960E] px-4 py-2 text-sm font-black text-[#17120A] disabled:opacity-50">
                {busyId === -1 ? "Processing..." : "Process outbox"}
              </button>
            </div>
          </div>

          {state === "loading" ? <p className="mt-6 text-sm font-semibold text-white/60">Loading reminder outbox...</p> : null}
          {state === "error" ? <p className="mt-6 text-sm font-semibold text-red-200">{message}</p> : null}

          {state === "ready" && !visibleRows.length ? <p className="mt-6 text-sm font-semibold text-white/60">No outbox rows match this view.</p> : null}

          {state === "ready" && visibleRows.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-white/[.045] text-xs uppercase tracking-[.14em] text-white/45">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3">Customer</th>
                    <th className="whitespace-nowrap px-4 py-3">Channel</th>
                    {!failedOnlyLocked ? <th className="whitespace-nowrap px-4 py-3">Status</th> : null}
                    <th className="whitespace-nowrap px-4 py-3">Attempts</th>
                    <th className="whitespace-nowrap px-4 py-3">Available</th>
                    <th className="whitespace-nowrap px-4 py-3">Order / Subscription</th>
                    <th className="whitespace-nowrap px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.id} className="odd:bg-white/[.025]">
                      <td className="border-t border-white/10 px-4 py-3 text-white/80">
                        <div className="font-bold text-white">{row.customer_phone ?? "Unknown customer"}</div>
                        <div className="text-xs text-white/45">{row.customer_email ?? row.schedule_key ?? "-"}</div>
                      </td>
                      <td className="border-t border-white/10 px-4 py-3 text-white/75">{row.channel}</td>
                      {!failedOnlyLocked ? (
                        <td className="border-t border-white/10 px-4 py-3">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-black ${badgeTone(row.status)}`}>{row.status}</span>
                        </td>
                      ) : null}
                      <td className="border-t border-white/10 px-4 py-3 text-white/75">{row.attempts}</td>
                      <td className="border-t border-white/10 px-4 py-3 text-white/75">{formatValue(row.available_at)}</td>
                      <td className="border-t border-white/10 px-4 py-3 text-white/75">
                        <div>{row.kind ?? "-"}</div>
                        <div className="text-xs text-white/45">{row.order_id ? `Order ${row.order_id}` : row.subscription_id ? `Subscription ${row.subscription_id}` : "-"}</div>
                      </td>
                      <td className="border-t border-white/10 px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelected(row)} className="rounded-[8px] border border-white/10 px-3 py-2 text-xs font-black text-white/75 hover:bg-white/10">Inspect</button>
                          {row.status === "failed" ? (
                            <button onClick={() => retryRow(row)} disabled={busyId === row.id} className="rounded-[8px] bg-[#D4960E] px-3 py-2 text-xs font-black text-[#17120A] disabled:opacity-50">
                              {busyId === row.id ? "Retrying..." : "Retry"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        {selected ? (
          <section className="admin-card rounded-[14px] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#D4960E]">Payload preview</p>
                <h2 className="mt-2 text-xl font-black text-white">{selected.title}</h2>
                <p className="mt-1 text-sm text-white/55">{selected.channel} / {selected.status} / attempts {selected.attempts}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white">Close</button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-[14px] bg-white/[.03] p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">Exact body</p>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-white/80">{selected.body}</pre>
              </div>
              <div className="rounded-[14px] bg-white/[.03] p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">Metadata</p>
                <div className="mt-3 grid gap-2 text-sm text-white/75">
                  <p><span className="font-black text-white">Customer:</span> {selected.customer_phone ?? "-"} {selected.customer_email ? ` / ${selected.customer_email}` : ""}</p>
                  <p><span className="font-black text-white">Schedule:</span> {selected.schedule_key ?? "-"}</p>
                  <p><span className="font-black text-white">Order:</span> {selected.order_id ?? "-"}</p>
                  <p><span className="font-black text-white">Subscription:</span> {selected.subscription_id ?? "-"}</p>
                  <p><span className="font-black text-white">Provider ID:</span> {selected.provider_message_id ?? "-"}</p>
                  <p><span className="font-black text-white">Last error:</span> {selected.last_error ?? "-"}</p>
                </div>
                {selected.customer_phone ? (
                  <Link href={`/customers/${encodeURIComponent(selected.customer_phone)}`} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
                    Open customer profile
                  </Link>
                ) : null}
                {selected.status === "failed" ? (
                  <button onClick={() => retryRow(selected)} disabled={busyId === selected.id} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#D4960E] px-4 py-2 text-sm font-black text-[#17120A] disabled:opacity-50">
                    <TriangleAlert size={16} />
                    {busyId === selected.id ? "Retrying..." : "Retry now"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[14px] bg-white/[.03] p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">Delivery payload</p>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[10px] bg-black/25 p-4 text-xs leading-6 text-white/75">{payloadText(selected.payload)}</pre>
              </div>
              <div className="rounded-[14px] bg-white/[.03] p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">Lifecycle</p>
                <div className="mt-3 grid gap-2 text-sm text-white/75">
                  <p><span className="font-black text-white">Available:</span> {formatValue(selected.available_at)}</p>
                  <p><span className="font-black text-white">Last attempt:</span> {formatValue(selected.last_attempt_at)}</p>
                  <p><span className="font-black text-white">Sent:</span> {formatValue(selected.sent_at)}</p>
                  <p><span className="font-black text-white">Created:</span> {formatValue(selected.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] bg-white/[.03] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">Audit timeline</p>
                  <p className="mt-1 text-sm text-white/55">Shows schedule creation, queueing, and matching delivery events for this row.</p>
                </div>
                <button onClick={() => loadTimeline(selected.id)} className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
                  Refresh timeline
                </button>
              </div>
              {timelineLoading ? <p className="mt-4 text-sm font-semibold text-white/60">Loading timeline...</p> : null}
              {timelineMessage ? <p className="mt-4 text-sm font-semibold text-red-200">{timelineMessage}</p> : null}
              {!timelineLoading && !timelineMessage && !timeline.length ? <p className="mt-4 text-sm font-semibold text-white/60">No timeline entries available for this row.</p> : null}
              {timeline.length ? (
                <div className="mt-4 grid gap-3">
                  {timeline.map((entry, index) => (
                    <div key={`${entry.source}-${entry.at ?? index}`} className="rounded-[12px] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-white">{entry.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[.16em] text-white/40">{entry.source}{entry.channel ? ` · ${entry.channel}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black uppercase tracking-[.16em] text-white/40">{entry.status ?? "-"}</p>
                          <p className="mt-1 text-sm text-white/65">{formatValue(entry.at)}</p>
                        </div>
                      </div>
                      {entry.details ? (
                        <pre className="mt-3 overflow-auto rounded-[10px] bg-black/30 p-3 text-xs leading-6 text-white/75">{JSON.stringify(entry.details, null, 2)}</pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
