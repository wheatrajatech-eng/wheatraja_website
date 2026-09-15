import { PageShell } from "@/components/page-shell";
import { CheckoutClient } from "@/components/checkout-client";

export default function CheckoutPage() {
  return (
    <PageShell eyebrow="Checkout" title="Fresh delivery details" text="OTP-secured checkout with saved addresses, coupon, wallet points and Razorpay payment handoff.">
      <CheckoutClient />
    </PageShell>
  );
}
