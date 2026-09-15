import { PageShell } from "@/components/page-shell";

export default function ShippingPolicyPage() {
  return (
    <PageShell eyebrow="Policy" title="Shipping & Fresh Delivery Policy" text="Wheat Raja delivers fresh chakki atta from Sector 78, Noida with distance-based rules.">
      <section className="mx-auto max-w-4xl px-6 pb-20 text-mitti/75">
        <div className="rounded-[8px] bg-white p-7 leading-8 shadow-card">
          <p>Orders within 20 KM are eligible for free delivery. Orders between 20-60 KM follow the published delivery slabs. Orders beyond 60 KM require manual approval.</p>
          <p className="mt-4">Every order is packed with batch and milled-date proof. Delivery SLA should be finalized operationally before launch and displayed here.</p>
        </div>
      </section>
    </PageShell>
  );
}
