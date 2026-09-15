import { AccountOrderDetailClient } from "@/components/account-order-detail-client";
import { PageShell } from "@/components/page-shell";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return (
    <PageShell eyebrow="Account" title="Order detail" text="Invoice, payment status and shipment timeline for this order.">
      <AccountOrderDetailClient orderId={orderId} />
    </PageShell>
  );
}
