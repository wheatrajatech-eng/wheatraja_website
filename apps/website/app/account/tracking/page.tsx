import { PageShell } from "@/components/page-shell";
import { AccountOrdersClient } from "@/components/account-orders-client";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="Order tracking" text="Placed, packed, out for delivery and delivered updates.">
      <AccountOrdersClient mode="tracking" />
    </PageShell>
  );
}
