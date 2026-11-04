"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, Heart, Menu, User, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";
import { CartLink } from "@/components/cart-link";

const desktopLinks = [
  ["Shop", "/products"],
  ["Atta Finder", "/atta-finder"],
  ["Subscribe", "/subscription"],
  ["Bulk Order", "/bulk-order"],
  ["Blog", "/blog"],
  ["About", "/about"],
  ["Contact", "/contact"]
];

const mobileLinks = [
  ["Home", "/"],
  ["Shop", "/products"],
  ["Atta Finder", "/atta-finder"],
  ["Subscribe", "/subscription"],
  ["Bulk Order", "/bulk-order"],
  ["Blog", "/blog"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Dashboard", "/account"]
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const transparent = false;
  const linkTone = "text-[#68412a]";
  const iconTone = "text-[#68412a]";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-[#e8dcc8] bg-[#fffdf7]/95 shadow-[0_8px_28px_rgba(104,65,42,0.08)] backdrop-blur-md transition-all duration-300 ${scrolled ? "shadow-[0_10px_34px_rgba(104,65,42,0.14)]" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/assets/logo/WheatRajaLogo.png" alt="Wheat Raja" width={112} height={46} className="h-10 w-auto object-contain" priority />
          <span className="hidden font-serif text-xl font-bold tracking-tight text-[#3b2418] sm:inline">Wheat Raja</span>
        </Link>

        <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${linkTone}`}>
          {desktopLinks.map(([label, href]) => (
            <Link key={href} href={href} className={`transition hover:opacity-100 ${pathname === href ? "font-semibold opacity-100" : transparent ? "opacity-95" : "opacity-75"}`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link href="/reviews" aria-label="Reviews" className={`rounded-full p-2 transition hover:bg-stone-100 ${transparent ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:bg-white/15" : ""}`}>
            <Heart className={`h-5 w-5 ${iconTone}`} />
          </Link>
          <CartLink transparent={transparent} />
          <Link href="/account" aria-label="Account" className={`rounded-full p-2 transition hover:bg-stone-100 ${transparent ? "hover:bg-white/15" : ""}`}>
            <User className={`h-5 w-5 ${iconTone}`} />
          </Link>
          <Link href="/account/wallet" aria-label="WR Wallet" className={`rounded-full p-2 transition hover:bg-stone-100 ${transparent ? "hover:bg-white/15" : ""}`}>
            <WalletCards className={`h-5 w-5 ${iconTone}`} />
          </Link>
          <Link href="/products" className="ml-1 hidden items-center gap-1.5 rounded-full bg-[#c98218] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a9600f] md:inline-flex">
            Shop Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => setMenuOpen((value) => !value)} aria-label="Menu" className={`rounded-full p-2 transition hover:bg-stone-100 md:hidden ${transparent ? "hover:bg-white/15" : ""}`}>
            {menuOpen ? <X className={`h-5 w-5 ${iconTone}`} /> : <Menu className={`h-5 w-5 ${iconTone}`} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="space-y-3 border-t border-stone-100 bg-white px-5 py-5 shadow-lg md:hidden">
          {mobileLinks.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`block py-1.5 font-medium ${pathname === href ? "font-semibold text-amber-700" : "text-stone-700"}`}>
              {label}
            </Link>
          ))}
          <Link href="/products" onClick={() => setMenuOpen(false)} className="mt-3 block rounded-full bg-amber-600 py-3 text-center font-semibold text-white">
            Shop Now
          </Link>
        </div>
      ) : null}
    </header>
  );
}
