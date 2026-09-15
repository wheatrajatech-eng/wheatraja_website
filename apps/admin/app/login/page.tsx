import { Suspense } from "react";
import { AdminLogin } from "@/components/admin-login";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-ink text-sm text-muted">Loading...</main>}>
      <AdminLogin />
    </Suspense>
  );
}
