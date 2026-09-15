"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminActions } from "@/components/admin-actions";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminShell } from "@/components/admin-shell";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type SettingRow = { id: number; key: string; value: string };

function csrfToken() {
  if (typeof document === "undefined") return "";
  return decodeURIComponent(document.cookie.split("; ").find((row) => row.startsWith("wr_csrf="))?.split("=")[1] ?? "");
}

const CHANNELS = [
  { key: "in_app", label: "In-app", description: "Always keep the reminder visible inside the customer dashboard." },
  { key: "email", label: "Email", description: "Send a production email when the customer has an email address." },
  { key: "whatsapp", label: "WhatsApp", description: "Send a WhatsApp reminder when the customer has a phone number and WhatsApp is configured." }
] as const;

export function AdminSettingsConsole() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["in_app", "email", "whatsapp"]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setStatus("Loading settings...");
    try {
      const response = await fetch(`${apiBase}/settings`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load settings");
      const payload = (await response.json()) as SettingRow[];
      setRows(payload);
      const reminderRow = payload.find((row) => row.key === "reminder_delivery_channels");
      const nextChannels = reminderRow?.value ? reminderRow.value.split(",").map((value) => value.trim()).filter(Boolean) : ["in_app", "email", "whatsapp"];
      setSelectedChannels(Array.from(new Set(["in_app", ...nextChannels])));
      setStatus("Settings loaded.");
    } catch {
      setStatus("Unable to load settings right now.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const reminderValue = useMemo(() => Array.from(new Set(["in_app", ...selectedChannels])).join(","), [selectedChannels]);

  async function saveChannels() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBase}/settings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken() ? { "X-CSRF-Token": csrfToken() } : {})
        },
        body: JSON.stringify({ key: "reminder_delivery_channels", value: reminderValue })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.detail || "Unable to save reminder channels");
      setRows((current) => {
        const next = current.filter((row) => row.key !== "reminder_delivery_channels");
        return [{ id: Number(payload.id), key: String(payload.key), value: String(payload.value) }, ...next];
      });
      setStatus("Reminder channel settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save reminder channels.");
    } finally {
      setSaving(false);
    }
  }

  function toggleChannel(channel: string) {
    setSelectedChannels((current) => {
      const base = new Set(current);
      if (channel === "in_app") {
        base.add("in_app");
        return Array.from(base);
      }
      if (base.has(channel)) base.delete(channel);
      else base.add(channel);
      base.add("in_app");
      return Array.from(base);
    });
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <section>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Settings</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Operational settings</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">Control reminder delivery channels from the admin console and keep the existing settings registry available below for other operational keys.</p>
        </section>

        <section className="admin-card rounded-[14px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#D4960E]">Reminder delivery</p>
              <h2 className="mt-2 text-xl font-black text-white">Customer reminder channels</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">Choose where reorder and subscription reminders are delivered. In-app is always kept on, while email and WhatsApp can be toggled independently.</p>
            </div>
            {status ? <p className="rounded-[10px] bg-white/10 px-4 py-2 text-sm font-semibold text-white/75">{status}</p> : null}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {CHANNELS.map((channel) => {
              const active = selectedChannels.includes(channel.key);
              const locked = channel.key === "in_app";
              return (
                <button
                  key={channel.key}
                  type="button"
                  onClick={() => toggleChannel(channel.key)}
                  className={`rounded-[14px] border p-4 text-left transition ${active ? "border-[#D4960E] bg-[#D4960E]/12" : "border-white/10 bg-white/[.03] hover:bg-white/[.05]"} ${locked ? "opacity-95" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">{channel.label}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-[#D4960E] text-[#17120A]" : "bg-white/10 text-white/55"}`}>{locked ? "Required" : active ? "On" : "Off"}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">{channel.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/70">Saved value: {reminderValue}</span>
            <button onClick={saveChannels} disabled={saving} className="rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#17120A] disabled:opacity-50">
              {saving ? "Saving..." : "Save reminder channels"}
            </button>
          </div>
        </section>

        <AdminActions module="settings" onDone={load} />
        <AdminDataTable endpoint="/settings" title="Settings registry" description="All operational settings stored in the backend." />
      </div>
    </AdminShell>
  );
}
