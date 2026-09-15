"use client";

import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApiError, createApiClient } from "../../shared/api-client";

const api = createApiClient();

type Row = Record<string, unknown>;
type State = "loading" | "ready" | "error";

function normalizeRow(row: unknown): Row {
  if (!row || typeof row !== "object") return { value: row };
  const normalized: Row = {};
  Object.entries(row as Row).forEach(([key, value]) => {
    if (Array.isArray(value)) normalized[key] = `${value.length} item${value.length === 1 ? "" : "s"}`;
    else if (value && typeof value === "object") normalized[key] = JSON.stringify(value);
    else normalized[key] = value;
  });
  return normalized;
}

function normalizePayload(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload.map(normalizeRow);
  if (!payload || typeof payload !== "object") return payload == null ? [] : [normalizeRow(payload)];
  const record = payload as Row;
  const arrayEntry = Object.entries(record).find(([, value]) => Array.isArray(value));
  if (arrayEntry) return (arrayEntry[1] as unknown[]).map(normalizeRow);
  return [normalizeRow(record)];
}

function cell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function AdminDataTable({ endpoint, title, description, refetch }: { endpoint: string; title: string; description: string; refetch?: (fn: () => Promise<void>) => void }) {
  const [state, setState] = useState<State>("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const pageSize = 12;

  async function load() {
    setState("loading");
    setMessage("");
    try {
      const payload = await api.get<unknown>(endpoint, { cache: "no-store" });
      const nextRows = normalizePayload(payload);
      setRows(nextRows);
      setSortKey((current) => current || Object.keys(nextRows[0] ?? {})[0] || "");
      setState("ready");
    } catch (error) {
      const detail = error instanceof ApiError && error.payload && typeof error.payload === "object" && "detail" in error.payload ? String((error.payload as { detail?: unknown }).detail) : "";
      setMessage(detail || "Unable to load this module.");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    refetch?.(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, endpoint]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = term ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term)) : rows;
    const sorted = [...matches].sort((a, b) => {
      const av = cell(a[sortKey]).toLowerCase();
      const bv = cell(b[sortKey]).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
    });
    return sorted;
  }, [query, rows, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const columns = (visibleRows[0] ? Object.keys(visibleRows[0]) : Object.keys(rows[0] ?? {})).slice(0, 9);

  function changeSort(key: string) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <section className="admin-card overflow-hidden rounded-[14px]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-w-[240px] items-center gap-2 rounded-[10px] border border-white/10 bg-white/[.055] px-3 py-2 text-sm text-white/65">
            <Search size={16} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search rows..." className="w-full bg-transparent text-white outline-none placeholder:text-white/35" />
          </label>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {state === "loading" ? <div className="p-8 text-sm font-semibold text-white/60">Loading records...</div> : null}
      {state === "error" ? <div className="p-8 text-sm font-semibold text-red-200">{message}</div> : null}
      {state === "ready" && !rows.length ? <div className="p-8 text-sm font-semibold text-white/60">No records found for this module.</div> : null}

      {state === "ready" && rows.length ? (
        <>
          <div className="admin-scrollbar overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-white/[.045] text-xs uppercase tracking-[.14em] text-white/45">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3">
                      <button onClick={() => changeSort(column)} className="font-black hover:text-white">
                        {column.replaceAll("_", " ")} {sortKey === column ? (sortDir === "asc" ? "↑" : "↓") : ""}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={`${page}-${index}`} className="border-t border-white/10 text-white/72 odd:bg-white/[.025]">
                    {columns.map((column) => (
                      <td key={column} className="max-w-[260px] truncate border-t border-white/10 px-4 py-3">{cell(row[column])}</td>
                    ))}
                    <td className="border-t border-white/10 px-4 py-3">
                      <button onClick={() => setSelected(row)} className="rounded-[8px] border border-white/10 px-3 py-2 text-xs font-black text-white/70 hover:bg-white/10 hover:text-white">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-4 text-sm text-white/55">
            <span>{filtered.length} result{filtered.length === 1 ? "" : "s"} / page {page + 1} of {pageCount}</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="rounded-[8px] border border-white/10 p-2 disabled:opacity-35"><ChevronLeft size={16} /></button>
              <button disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className="rounded-[8px] border border-white/10 p-2 disabled:opacity-35"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="admin-card max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-[14px] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black">Record detail</h3>
              <button onClick={() => setSelected(null)} className="rounded-[8px] bg-white/10 px-3 py-2 text-sm font-black">Close</button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-[10px] bg-black/25 p-4 text-xs leading-6 text-white/75">{JSON.stringify(selected, null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </section>
  );
}
