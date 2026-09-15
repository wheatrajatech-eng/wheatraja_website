import { PageShell } from "@/components/page-shell";
import { LoginOtpForm } from "@/components/login-otp-form";

export default function LoginPage() {
  return (
    <PageShell eyebrow="Secure account" title="Login or create your Wheat Raja profile" text="New customers sign up once with profile details. Returning customers login anytime with phone OTP.">
      <section className="mx-auto max-w-xl px-6 pb-20">
        <LoginOtpForm />
      </section>
    </PageShell>
  );
}
