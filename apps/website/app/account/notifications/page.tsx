import { AccountNotificationsClient } from "@/components/account-notifications-client";
import { PageShell } from "@/components/page-shell";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="Notifications" text="Order, payment, return, reminder and support updates in one place.">
      <AccountNotificationsClient />
    </PageShell>
  );
}
