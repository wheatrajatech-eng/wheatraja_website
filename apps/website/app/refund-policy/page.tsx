import { PageShell } from "@/components/page-shell";

export default function RefundPolicyPage() {
  return (
    <PageShell eyebrow="Policy" title="Freshness Replacement & Refund Policy" text="Clear food policies increase buyer confidence before checkout.">
      <section className="mx-auto max-w-4xl px-6 pb-20 text-mitti/75">
        <div className="rounded-[8px] bg-white p-7 leading-8 shadow-card">
          <p>Damaged, leaked, stale-smelling, or incorrect packs should be reported with photos within the policy window. Approved cases receive replacement or refund as per order status.</p>
          <p className="mt-4">Final legal language, refund timelines, and support SLA must be reviewed before production launch.</p>
        </div>
      </section>
    </PageShell>
  );
}
