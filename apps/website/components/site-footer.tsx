"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="bg-stone-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div>
          <Image src="/assets/logo/WheatRajaLogo.png" alt="WheatRaja logo" width={150} height={70} className="h-16 w-auto object-contain" />
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">Fresh chakki atta milled after your order in Noida. Stone-ground, pure and packed for soft rotis.</p>
          <div className="mt-5 flex gap-3">
            <Image src="/assets/trust/WR_FSSAI.png" alt="FSSAI approved WheatRaja badge" width={70} height={70} className="h-16 w-16 rounded-full object-cover" />
            <Image src="/assets/trust/WR_NABL.png" alt="NABL certified WheatRaja badge" width={70} height={70} className="h-16 w-16 rounded-full object-cover" />
          </div>
        </div>
        <div>
          <p className="mb-3 font-semibold">Shop</p>
          <Link href="/products" className="block text-sm text-white/55">Products</Link>
          <Link href="/delivery" className="mt-2 block text-sm text-white/55">Check Delivery</Link>
          <Link href="/subscription" className="mt-2 block text-sm text-white/55">Subscription</Link>
          <Link href="/bulk-order" className="mt-2 block text-sm text-white/55">Bulk Order</Link>
        </div>
        <div>
          <p className="mb-3 font-semibold">Company</p>
          <Link href="/about" className="block text-sm text-white/55">About</Link>
          <Link href="/reviews" className="mt-2 block text-sm text-white/55">Reviews</Link>
          <Link href="/contact" className="mt-2 block text-sm text-white/55">Contact</Link>
          <Link href="/account/reminders" className="mt-2 block text-sm text-white/55">Reminders</Link>
        </div>
        <div>
          <p className="mb-3 font-semibold">Trust</p>
          <Link href="/shipping-policy" className="block text-sm text-white/55">Shipping Policy</Link>
          <Link href="/refund-policy" className="mt-2 block text-sm text-white/55">Refund Policy</Link>
          <Link href="/privacy-policy" className="mt-2 block text-sm text-white/55">Privacy Policy</Link>
          <Link href="/terms" className="mt-2 block text-sm text-white/55">Terms</Link>
        </div>
        <div>
          <p className="mb-3 font-semibold">Noida Kitchen</p>
          <p className="text-sm text-white/55">Sector 78, Noida</p>
          <p className="mt-2 text-sm text-white/55">WhatsApp: +91 98765 43210</p>
          <Image src="/assets/contact/whatsapp_qr.png" alt="Scan WheatRaja WhatsApp QR code" width={96} height={96} className="mt-4 h-24 w-24 rounded-[8px] bg-white p-2" />
        </div>
      </div>
    </footer>
  );
}
