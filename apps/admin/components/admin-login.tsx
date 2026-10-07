"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createApiClient, ApiError } from "../../shared/api-client";
import type { ApiUser } from "../../shared/types";

const api = createApiClient();

type LoginStage = "checking" | "phone" | "otp" | "submitting" | "unauthorized" | "offline";
type SessionResponse = Partial<ApiUser> & { authenticated: boolean };

export function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<LoginStage>("checking");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState(searchParams.get("message") ?? "");
  const [devOtp, setDevOtp] = useState("");

  useEffect(() => {
    api.get<SessionResponse>("/auth/session", { cache: "no-store" })
      .then((session) => {
        if (!session.authenticated) {
          setStage("phone");
          return;
        }
        if (session.role === "admin" || session.role === "superadmin") {
          router.replace("/");
          return;
        }
        setMessage("This account is not allowed to access the admin dashboard.");
        setStage("unauthorized");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          setStage("phone");
          return;
        }
        setMessage("Admin API is offline or unreachable.");
        setStage("offline");
      });
  }, [router]);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStage("submitting");
    setMessage("");
    setDevOtp("");
    try {
      const response = await api.post<{ message: string; dev_otp?: string; demo_otp?: string }>("/auth/otp/request", { phone });
      setDevOtp(response.demo_otp ?? response.dev_otp ?? "");
      setMessage(response.demo_otp ? `Demo OTP: ${response.demo_otp}` : response.dev_otp ? `Development OTP: ${response.dev_otp}` : response.message);
      setStage("otp");
    } catch {
      setMessage("Could not request OTP. Check that the API is running.");
      setStage("offline");
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStage("submitting");
    setMessage("");
    try {
      const response = await api.post<{ role: string }>("/auth/otp/verify", { phone, otp });
      if (response.role !== "admin" && response.role !== "superadmin") {
        setMessage("Login succeeded, but this user is not an admin.");
        setStage("unauthorized");
        return;
      }
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setMessage("Invalid or expired OTP.");
        setStage("otp");
        return;
      }
      setMessage("Could not verify OTP. Check that the API is running.");
      setStage("offline");
    }
  }

  const busy = stage === "checking" || stage === "submitting";

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5 text-white">
      <section className="w-full max-w-[420px] rounded-[8px] border border-white/10 bg-white/[.04] p-6 shadow-[0_24px_90px_rgba(0,0,0,.28)]">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gold text-sm font-black text-ink">WR</div>
          <div>
            <h1 className="text-2xl font-black">Admin Login</h1>
            <p className="text-sm text-muted">Wheat Raja operations</p>
          </div>
        </div>

        {message ? <p className="mb-5 rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm text-gold">{message}</p> : null}

        {stage === "checking" ? <p className="text-sm text-muted">Checking session...</p> : null}

        {(stage === "phone" || stage === "offline") ? (
          <form onSubmit={requestOtp} className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Admin phone
              <input className="rounded-[8px] border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter configured admin phone" />
            </label>
            <button disabled={busy} className="rounded-[8px] bg-gold px-4 py-3 font-black text-ink disabled:opacity-60">Send OTP</button>
          </form>
        ) : null}

        {stage === "otp" || stage === "submitting" ? (
          <form onSubmit={verifyOtp} className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              OTP
              <input className="rounded-[8px] border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold" value={otp} onChange={(event) => setOtp(event.target.value)} />
            </label>
            {devOtp ? <p className="text-xs text-muted">Use `{devOtp}` for local development.</p> : null}
            <button disabled={busy} className="rounded-[8px] bg-gold px-4 py-3 font-black text-ink disabled:opacity-60">Login</button>
            <button type="button" onClick={() => setStage("phone")} className="text-sm font-bold text-muted hover:text-white">Use another phone</button>
          </form>
        ) : null}

        {stage === "unauthorized" ? (
          <button onClick={() => setStage("phone")} className="rounded-[8px] bg-gold px-4 py-3 font-black text-ink">Try another account</button>
        ) : null}
      </section>
    </main>
  );
}
