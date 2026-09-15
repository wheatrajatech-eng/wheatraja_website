import { PageShell } from "@/components/page-shell";
import { AccountUtilityClient } from "@/components/account-utility-client";
export default function Page() { return <PageShell eyebrow="Account" title="Profile" text="Name, phone, preferences and notification settings."><AccountUtilityClient mode="profile" /></PageShell>; }
