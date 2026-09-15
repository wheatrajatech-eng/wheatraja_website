import { PageShell } from "@/components/page-shell";
import { AccountOrdersClient } from "@/components/account-orders-client";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="My orders" text="Recent orders, invoices and reorder actions.">
      <AccountOrdersClient />
    </PageShell>
  );
}
