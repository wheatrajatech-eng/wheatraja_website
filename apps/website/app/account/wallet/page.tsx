import { PageShell } from "@/components/page-shell";
import { AccountOrdersClient } from "@/components/account-orders-client";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="WR Wallet" text="Earn 2% points on orders. Redemption unlocks at 100 points.">
      <AccountOrdersClient mode="wallet" />
    </PageShell>
  );
}
