import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { DeliveryChecker } from "@/components/delivery-checker";
import { deliveryRules } from "@/lib/data";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";

export default function DeliveryPage() {
  const areas = ["Noida", "Noida Extension", "Greater Noida West", "Indirapuram", "Selected Ghaziabad zones", "Selected Delhi zones by distance"];
  return (
    <PageShell eyebrow="Delivery checker" title="Fresh atta delivery from Sector 78, Noida." text="Free within 20 KM. Clear charges after that. Delivery availability is based on distance and operational feasibility.">
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 md:grid-cols-[1fr_1fr]">
        <DeliveryChecker />
        <div className="overflow-hidden rounded-[8px] bg-white shadow-card">
          <div className="relative h-64">
            <Image src="/assets/delivery/mahagunmoderne.png" alt="Noida premium apartment delivery area for WheatRaja" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="p-7">
            {deliveryRules.map((rule) => <p key={rule.range} className="flex justify-between border-b border-mitti/10 py-3"><span>{rule.range}</span><strong>{rule.charge}</strong></p>)}
          </div>
        </div>
      </section>
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="rounded-[8px] bg-forest p-7 text-cream shadow-card">
            <MapPin className="text-wheat" size={30} />
            <h2 className="mt-5 font-serif text-3xl">Delivery areas</h2>
            <div className="mt-5 grid gap-2">
              {areas.map((area) => <p key={area} className="rounded-[8px] bg-white/10 p-3 text-sm font-semibold">{area}</p>)}
            </div>
          </div>
          <div className="rounded-[8px] bg-cream p-7 shadow-card">
            <Clock3 className="text-leaf" size={30} />
            <h2 className="mt-5 font-serif text-3xl text-forest">Delivery timeline</h2>
            <p className="mt-4 leading-7 text-mitti/70">Orders are milled after checkout, packed with batch proof, and sent through the freshest available delivery slot for your area.</p>
          </div>
          <div className="rounded-[8px] bg-cream p-7 shadow-card">
            <ShieldCheck className="text-leaf" size={30} />
            <h2 className="mt-5 font-serif text-3xl text-forest">No hidden surprises</h2>
            <p className="mt-4 leading-7 text-mitti/70">Delivery charge is shown before checkout. If your distance is outside the current radius, WhatsApp support can check special delivery options.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
