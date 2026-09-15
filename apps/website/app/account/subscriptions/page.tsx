import { PageShell } from "@/components/page-shell";
import { AccountUtilityClient } from "@/components/account-utility-client";
export default function Page() { return <PageShell eyebrow="Account" title="My subscriptions" text="Pause, skip, renew or change monthly atta plan."><AccountUtilityClient mode="subscriptions" /></PageShell>; }
