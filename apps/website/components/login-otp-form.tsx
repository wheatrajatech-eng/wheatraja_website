"use client";

import { useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

type Mode = "login" | "signup";

export function LoginOtpForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function setApiMessage(data: any, fallback: string) {
    const canShowDevOtp = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_SHOW_DEV_OTP === "true";
    setMessage(canShowDevOtp && data.dev_otp ? `Development OTP: ${data.dev_otp}` : data.detail || data.message || fallback);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setOtp("");
    setSent(false);
    setMessage("");
  }

  async function requestOtp() {
    setLoading(true);
    setMessage("");
    try {
      const path = mode === "signup" ? "/auth/signup/request" : "/auth/otp/request";
      const body = mode === "signup" ? { phone, name, email: email || null } : { phone };
      const response = await fetch(`${apiBase}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      setSent(response.ok);
      setApiMessage(data, "OTP sent");
      if (!response.ok && response.status === 404) {
        setMode("signup");
      }
      if (!response.ok && response.status === 409) {
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/auth/otp/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp })
      });
      const data = await response.json();
      setMessage(response.ok ? (mode === "signup" ? "Account created. Opening your dashboard..." : "Logged in. Opening your dashboard...") : data.detail || "Invalid OTP");
      if (response.ok) {
        const next = new URLSearchParams(window.location.search).get("next") || (data.role === "admin" ? "/admin" : "/account");
        window.setTimeout(() => { window.location.href = next; }, 500);
      }
    } finally {
      setLoading(false);
    }
  }

  const canRequest = phone.trim().length >= 10 && (mode === "login" || name.trim().length >= 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 border-b border-stone-100 bg-stone-50 p-1">
        <button onClick={() => switchMode("login")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "login" ? "bg-amber-600 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>Login</button>
        <button onClick={() => switchMode("signup")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${mode === "signup" ? "bg-amber-600 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"}`}>Sign Up</button>
      </div>

      <div className="p-6 md:p-7">
        <h2 className="font-serif text-3xl font-bold text-stone-900">{mode === "signup" ? "Create your Wheat Raja profile" : "Login with phone OTP"}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          {mode === "signup"
            ? "First-time customers create a profile once. After that, this phone can login anytime with OTP."
            : "Returning customers login like Amazon or Myntra: enter your registered phone, verify OTP, continue shopping."}
        </p>

        <div className="mt-6 grid gap-3">
          {mode === "signup" ? (
            <>
              <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400" placeholder="Full name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400" placeholder="Email optional" />
            </>
          ) : null}
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-amber-400" placeholder="+91 mobile number" />
          <button onClick={requestOtp} disabled={!canRequest || loading} className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50">
            {loading ? "Please wait..." : mode === "signup" ? "Create Profile & Send OTP" : "Send Login OTP"}
          </button>
        </div>

        {sent ? (
          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <input value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400" placeholder="Enter OTP" />
            <button onClick={verifyOtp} disabled={otp.length < 4 || loading} className="mt-3 w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-50">
              {loading ? "Verifying..." : mode === "signup" ? "Verify & Create Account" : "Verify & Login"}
            </button>
          </div>
        ) : null}

        {message ? <p className="mt-4 rounded-xl bg-stone-50 p-3 text-center text-xs font-semibold text-stone-600">{message}</p> : null}
      </div>
    </div>
  );
}
