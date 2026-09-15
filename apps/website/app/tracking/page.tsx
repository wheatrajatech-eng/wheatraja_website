import { CheckCircle2, CircleDot, Headphones, PackageCheck, Truck, Wheat } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui";

const timeline = [
  ["Placed", "Order received and queued for fresh milling.", CheckCircle2],
  ["Milled", "Wheat is stone-ground after your order.", Wheat],
  ["Packed", "Pack sealed with batch and packed-date proof.", PackageCheck],
  ["Out for delivery", "Fresh atta is moving through the local route.", Truck],
  ["Delivered", "Soft rotis are now your department.", CircleDot]
];

export default function TrackingPage() {
  return (
    <PageShell eyebrow="Order tracking" title="Track your fresh atta order." text="A clear timeline from order placement to milling, packing, dispatch and doorstep delivery.">
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20">
        {timeline.map(([title, text, Icon], index) => (
          <div key={String(title)} className="grid gap-4 rounded-[8px] border border-mitti/10 bg-white p-5 shadow-card md:grid-cols-[72px_1fr_auto] md:items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-wheat">
              <Icon size={24} />
            </div>
            <div>
              <p className="font-serif text-2xl text-forest">{String(title)}</p>
              <p className="mt-1 text-sm text-mitti/70">{String(text)}</p>
            </div>
            <span className={index === 0 ? "rounded-full bg-leaf/10 px-4 py-2 text-sm font-black text-leaf" : "rounded-full bg-cream px-4 py-2 text-sm font-bold text-mitti/60"}>
              {index === 0 ? "Active" : "Pending"}
            </span>
          </div>
        ))}
        <div className="mt-4 rounded-[8px] bg-forest p-6 text-cream shadow-card">
          <Headphones className="text-wheat" />
          <p className="mt-4 font-serif text-3xl">Need support?</p>
          <p className="mt-2 text-cream/70">WhatsApp support can confirm delivery slots, society entry details and route updates.</p>
          <div className="mt-5"><ButtonLink href="/contact">Contact Support</ButtonLink></div>
        </div>
      </section>
    </PageShell>
  );
}
