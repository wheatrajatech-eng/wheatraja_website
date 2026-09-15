import { AccountWishlistClient } from "@/components/account-wishlist-client";
import { PageShell } from "@/components/page-shell";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="Wishlist" text="Saved products you can move into your cart when you are ready.">
      <AccountWishlistClient />
    </PageShell>
  );
}
