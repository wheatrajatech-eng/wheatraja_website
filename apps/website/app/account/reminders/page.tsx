import { PageShell } from "@/components/page-shell";
import { AccountRemindersClient } from "@/components/account-reminders-client";

export default function Page() {
  return (
    <PageShell eyebrow="Account" title="Reminders" text="See your reorder reminders and subscription reminders in one place.">
      <AccountRemindersClient />
    </PageShell>
  );
}
