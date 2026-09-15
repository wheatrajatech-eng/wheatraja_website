"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";
      const response = await fetch(`${base}/auth/logout`, { method: "POST", credentials: "include", headers: csrfHeaders() });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      window.location.replace("/login");
    } catch {
      setError("Sign out failed. Please try again.");
      setBusy(false);
    }
  }
  return <div className="mt-3">
    <button type="button" onClick={logout} disabled={busy} className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
      <LogOut size={18} />{busy ? "Signing out..." : "Sign Out"}
    </button>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
  </div>;
}
