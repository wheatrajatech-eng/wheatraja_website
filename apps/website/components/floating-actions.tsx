"use client";

import Image from "next/image";
import { ArrowUp } from "lucide-react";

export function FloatingActions() {
  function moveToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      <button
        type="button"
        onClick={moveToTop}
        aria-label="Back to top"
        className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-stone-950 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-950"
      >
        <ArrowUp size={21} strokeWidth={2.5} />
      </button>
      <a
        href="https://wa.me/919876543210"
        aria-label="Chat with WheatRaja on WhatsApp"
        className="grid h-14 w-14 place-items-center rounded-full bg-white p-1 shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 focus:ring-offset-stone-950"
      >
        <Image src="/assets/contact/whatsapp-logo.svg" alt="WhatsApp" width={48} height={48} />
      </a>
    </div>
  );
}
