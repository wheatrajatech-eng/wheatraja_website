import { PageShell } from "@/components/page-shell";
import { AccountUtilityClient } from "@/components/account-utility-client";
export default function Page() { return <PageShell eyebrow="Account" title="Refer & Earn" text="Each user gets a unique four-letter referral code with no repeated letters."><AccountUtilityClient mode="refer" /></PageShell>; }
