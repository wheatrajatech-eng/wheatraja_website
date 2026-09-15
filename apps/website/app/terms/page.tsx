import { PageShell } from "@/components/page-shell";

export default function TermsPage() {
  return (
    <PageShell eyebrow="Policy" title="Terms of Service" text="Commercial terms for orders, delivery, subscriptions, wallet and referrals.">
      <section className="mx-auto max-w-4xl px-6 pb-20 text-mitti/75">
        <div className="rounded-[8px] bg-white p-7 leading-8 shadow-card">
          <p>Final terms must be reviewed before production. They should define subscription billing, delivery exceptions, wallet redemption, referral abuse, cancellations and support timelines.</p>
        </div>
      </section>
    </PageShell>
  );
}
