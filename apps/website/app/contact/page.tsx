import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

const contactCards = [
  { icon: Phone, label: "Call", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: MessageCircle, label: "WhatsApp", value: "Order & support chat", href: "https://wa.me/919876543210" },
  { icon: Mail, label: "Email", value: "care@wheatraja.com", href: "mailto:care@wheatraja.com" },
  { icon: MapPin, label: "Visit", value: "Sector 78, Noida", href: "https://maps.google.com/?q=Sector%2078%20Noida" }
];

const helpTopics = ["Check delivery serviceability", "Start or pause subscription", "Bulk society order", "Wallet or payment help"];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FBF7ED] pt-24">
      <section className="relative overflow-hidden bg-stone-950 px-6 py-20 text-white md:py-28">
        <div className="absolute inset-0 opacity-35">
          <Image src="/assets/banners/cover7.png" alt="Fresh wheat flour and rotis" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/86 to-stone-950/40" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-300">Contact WheatRaja</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] md:text-7xl">We are here for orders, delivery and fresh atta support.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">Reach us for Noida delivery checks, subscription planning, wallet help, bulk society requirements or product questions.</p>
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-7xl gap-4 px-6 pb-16 md:grid-cols-4">
        {contactCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="group rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_18px_50px_rgba(74,52,30,.12)] transition hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Icon size={22} />
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-stone-500">{card.label}</p>
              <p className="mt-2 font-bold text-stone-950">{card.value}</p>
              <ChevronRight className="mt-5 text-amber-700 transition group-hover:translate-x-1" size={18} />
            </Link>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.2fr_.8fr]">
        <ContactForm />
        <aside className="space-y-5">
          <div className="rounded-[28px] bg-stone-950 p-6 text-white shadow-[0_24px_70px_rgba(28,25,23,.22)] md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Quick WhatsApp order</p>
            <div className="mt-6 w-fit rounded-[22px] bg-white p-3">
              <Image src="/assets/contact/whatsapp_qr.png" alt="Scan WheatRaja WhatsApp QR code to order" width={190} height={190} className="h-44 w-44 rounded-xl object-contain md:h-48 md:w-48" />
            </div>
            <p className="mt-5 text-sm leading-6 text-stone-300">Scan the QR code or open WhatsApp to place an order, confirm delivery zone or ask about subscriptions.</p>
            <Link href="https://wa.me/919876543210" className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-black text-stone-950">
              Chat now <MessageCircle size={17} />
            </Link>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(74,52,30,.1)]">
            <div className="flex items-center gap-3">
              <Clock className="text-amber-700" size={22} />
              <h2 className="font-serif text-3xl text-stone-950">Office hours</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm font-semibold text-stone-700">
              <p className="flex justify-between gap-4"><span>Monday to Saturday</span><span>9 AM - 8 PM</span></p>
              <p className="flex justify-between gap-4"><span>Sunday</span><span>10 AM - 5 PM</span></p>
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_rgba(74,52,30,.1)]">
            <h2 className="font-serif text-3xl text-stone-950">We can help with</h2>
            <div className="mt-5 space-y-3">
              {helpTopics.map((topic) => (
                <p key={topic} className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-800">
                  <Check className="text-amber-700" size={16} /> {topic}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
