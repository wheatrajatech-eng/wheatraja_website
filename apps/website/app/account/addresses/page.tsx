import { PageShell } from "@/components/page-shell";
import { AccountUtilityClient } from "@/components/account-utility-client";
export default function Page() { return <PageShell eyebrow="Account" title="Saved addresses" text="Manage delivery addresses and first-order discount eligibility."><AccountUtilityClient mode="addresses" /></PageShell>; }
