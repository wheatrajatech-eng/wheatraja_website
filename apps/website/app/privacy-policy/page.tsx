import { PageShell } from "@/components/page-shell";

export default function PrivacyPolicyPage() {
  return (
    <PageShell eyebrow="Policy" title="Privacy Policy" text="How Wheat Raja handles customer phone, address, payment and order data.">
      <section className="mx-auto max-w-4xl px-6 pb-20 text-mitti/75">
        <div className="rounded-[8px] bg-white p-7 leading-8 shadow-card">
          <p>Customer data is used for authentication, delivery, payment reconciliation, order support, wallet, referral and subscription services. Payment details are handled by the payment provider and should not be stored directly by Wheat Raja.</p>
        </div>
      </section>
    </PageShell>
  );
}
