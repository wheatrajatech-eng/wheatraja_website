import { PageShell } from "@/components/page-shell";
import { CartPageClient } from "@/components/cart-page-client";

export default function CartPage() {
  return (
    <PageShell eyebrow="Cart" title="Your fresh atta basket">
      <CartPageClient />
    </PageShell>
  );
}
