"use client";

import { ArrowLeft, Mail, MapPin, Phone, ShieldAlert, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type CustomerProfile = {
  id: number;
  phone: string;
  name?: string | null;
  email?: string | null;
  blocked?: boolean;
  admin_notes?: string | null;
  addresses?: Array<{
    id: number;
    label: string;
    line1: string;
    city?: string | null;
    pincode?: string | null;
    is_default?: boolean;
  }>;
};

export function AdminCustomerProfile({ phone }: { phone: string }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setState("loading");
      setMessage("");
      try {
        const response = await fetch(`${apiBase}/users/admin/customers/${encodeURIComponent(phone)}`, { credentials: "include", cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.detail || "Unable to load customer profile");
        if (mounted) {
          setProfile(payload as CustomerProfile);
          setState("ready");
        }
      } catch (error) {
        if (mounted) {
          setProfile(null);
          setMessage(error instanceof Error ? error.message : "Unable to load customer profile");
          setState("error");
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [phone]);

  const primaryAddress = useMemo(() => profile?.addresses?.find((row) => row.is_default) ?? profile?.addresses?.[0] ?? null, [profile]);

  return (
    <AdminShell>
      <div className="grid gap-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Customer profile</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{profile?.name || profile?.phone || phone}</h1>
            <p className="mt-2 text-sm text-white/58">Single-customer drilldown for admin support, review, and follow-up actions.</p>
          </div>
          <Link href="/customers" className="inline-flex items-center gap-2 rounded-[10px] bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white/15">
            <ArrowLeft size={16} />
            Back to customers
          </Link>
        </section>

        {state === "loading" ? <section className="admin-card rounded-[14px] p-5 text-sm font-semibold text-white/60">Loading customer profile...</section> : null}
        {state === "error" ? <section className="admin-card rounded-[14px] p-5 text-sm font-semibold text-red-200">{message}</section> : null}

        {state === "ready" && profile ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="admin-card rounded-[14px] p-5">
                <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">Phone</p>
                <p className="mt-3 flex items-center gap-2 text-lg font-black text-white"><Phone size={18} className="text-[#D4960E]" />{profile.phone}</p>
              </div>
              <div className="admin-card rounded-[14px] p-5">
                <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">Email</p>
                <p className="mt-3 flex items-center gap-2 text-lg font-black text-white"><Mail size={18} className="text-[#D4960E]" />{profile.email || "-"}</p>
              </div>
              <div className="admin-card rounded-[14px] p-5">
                <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">Status</p>
                <p className="mt-3 flex items-center gap-2 text-lg font-black text-white">
                  <ShieldAlert size={18} className={profile.blocked ? "text-red-300" : "text-emerald-300"} />
                  {profile.blocked ? "Blocked" : "Active"}
                </p>
              </div>
              <div className="admin-card rounded-[14px] p-5">
                <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">Addresses</p>
                <p className="mt-3 flex items-center gap-2 text-lg font-black text-white"><MapPin size={18} className="text-[#D4960E]" />{profile.addresses?.length ?? 0}</p>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <div className="admin-card rounded-[14px] p-5">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={18} className="text-[#D4960E]" />
                  <h2 className="text-xl font-black text-white">Profile details</h2>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-white/75">
                  <p><span className="font-black text-white">Name:</span> {profile.name || "-"}</p>
                  <p><span className="font-black text-white">Admin notes:</span> {profile.admin_notes || "-"}</p>
                  <p><span className="font-black text-white">Customer id:</span> {profile.id}</p>
                </div>
              </div>

              <div className="admin-card rounded-[14px] p-5">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#D4960E]" />
                  <h2 className="text-xl font-black text-white">Primary address</h2>
                </div>
                {primaryAddress ? (
                  <div className="mt-4 grid gap-2 text-sm text-white/75">
                    <p><span className="font-black text-white">Label:</span> {primaryAddress.label}</p>
                    <p><span className="font-black text-white">Address:</span> {primaryAddress.line1}</p>
                    <p><span className="font-black text-white">City:</span> {primaryAddress.city || "-"}</p>
                    <p><span className="font-black text-white">Pincode:</span> {primaryAddress.pincode || "-"}</p>
                    <p><span className="font-black text-white">Default:</span> {primaryAddress.is_default ? "Yes" : "No"}</p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/60">No saved addresses available.</p>
                )}
              </div>
            </section>

            <section className="admin-card rounded-[14px] p-5">
              <h2 className="text-xl font-black text-white">All addresses</h2>
              {profile.addresses?.length ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {profile.addresses.map((address) => (
                    <div key={address.id} className="rounded-[12px] border border-white/10 bg-white/[.03] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-white">{address.label}</p>
                        {address.is_default ? <span className="rounded-full bg-[#D4960E] px-2 py-1 text-[11px] font-black text-[#17120A]">Default</span> : null}
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-white/72">
                        <p>{address.line1}</p>
                        <p>{address.city || "-"} {address.pincode ? `· ${address.pincode}` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-white/60">No addresses saved for this customer.</p>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
