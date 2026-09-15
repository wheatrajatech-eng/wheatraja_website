"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgePercent,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  FileClock,
  Gift,
  Image,
  Inbox,
  LifeBuoy,
  ListChecks,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Newspaper,
  Package,
  ReceiptText,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tags,
  TriangleAlert,
  Truck,
  Undo2,
  UserCog,
  Users,
  WalletCards,
  Warehouse
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { createApiClient } from "../../shared/api-client";
import type { ApiUser } from "../../shared/types";
import { adminModules } from "@/lib/admin-config";

const api = createApiClient();

const icons: Record<string, LucideIcon> = {
  BadgePercent,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  FileClock,
  Gift,
  Image,
  Inbox,
  LifeBuoy,
  ListChecks,
  LayoutDashboard,
  Newspaper,
  Package,
  ReceiptText,
  RefreshCw,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tags,
  TriangleAlert,
  Truck,
  Undo2,
  UserCog,
  Users,
  WalletCards,
  Warehouse
};

type SessionResponse = Partial<ApiUser> & { authenticated?: boolean };
type AdminState = "loading" | "ready" | "unauthenticated" | "unauthorized" | "offline";

function stateCopy(state: AdminState) {
  if (state === "loading") return "Checking admin session...";
  if (state === "unauthenticated") return "Please sign in to continue.";
  if (state === "unauthorized") return "Your account does not have admin access.";
  return "The admin API is not reachable.";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<AdminState>("loading");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get<SessionResponse>("/auth/session", { cache: "no-store" })
      .then((session) => {
        if (!mounted) return;
        if (!session.authenticated) {
          setState("unauthenticated");
          router.replace("/login");
          return;
        }
        if (!["admin", "superadmin"].includes(String(session.role))) {
          setState("unauthorized");
          return;
        }
        setUser(session as ApiUser);
        setState("ready");
      })
      .catch(() => {
        if (mounted) setState("offline");
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await api.post("/auth/logout");
      window.location.replace("/login");
    } catch {
      setLogoutError("Sign out failed. Please try again.");
      setLoggingOut(false);
    }
  }

  if (state !== "ready") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#13131f] px-5">
        <section className="admin-card max-w-md rounded-[14px] p-8 text-center">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Wheat Raja Admin</p>
          <h1 className="mt-3 text-2xl font-black text-white">{stateCopy(state)}</h1>
          {state !== "loading" ? <Link className="mt-6 inline-flex rounded-[10px] bg-[#D4960E] px-5 py-3 text-sm font-black text-[#18120A]" href="/login">Open login</Link> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell min-h-screen bg-[#13131f] text-white">
      <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-white/10 bg-[#171727]/95 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard">
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#D4960E]">Wheat Raja</p>
              <p className="mt-1 text-xl font-black text-white">Admin Console</p>
            </Link>
            <button onClick={logout} disabled={loggingOut} className="rounded-[10px] border border-white/10 p-3 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
          {logoutError ? <p role="alert" className="mt-2 text-sm text-red-200">{logoutError}</p> : null}
          <nav className="admin-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2 lg:grid lg:max-h-[calc(100vh-128px)] lg:overflow-y-auto lg:pr-1">
            {adminModules.map((module) => {
              const Icon = icons[module.icon] ?? LayoutDashboard;
              const active = pathname === module.href || (pathname === "/" && module.key === "dashboard");
              return (
                <Link key={module.key} href={module.href} className={`inline-flex shrink-0 items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-bold transition lg:w-full ${active ? "bg-[#D4960E] text-[#17120A]" : "text-white/68 hover:bg-white/10 hover:text-white"}`}>
                  <Icon size={18} />
                  {module.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">Production operations</p>
              <p className="mt-1 text-sm text-white/65">Signed in as {user?.name || user?.phone}</p>
            </div>
            <Link href="/readiness" className="rounded-[10px] border border-white/10 px-4 py-2 text-sm font-black text-white/75 hover:bg-white/10">Readiness checks</Link>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
