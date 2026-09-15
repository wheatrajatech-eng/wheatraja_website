import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wheatraja.com"),
  title: {
    default: "Wheat Raja | Fresh Atta Milled After Your Order",
    template: "%s | Wheat Raja"
  },
  description: "Premium fresh chakki atta in Noida. Stone-ground MP wheat, milled after your order and delivered fresh to your home.",
  openGraph: {
    title: "Wheat Raja",
    description: "Fresh atta, stone-ground after your order.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Wheat Raja",
    description: "Fresh chakki atta milled after order in Noida.",
    address: { "@type": "PostalAddress", addressLocality: "Noida", addressRegion: "Uttar Pradesh", addressCountry: "IN" },
    areaServed: ["Noida", "Noida Extension", "Indirapuram", "Greater Noida West"],
    telephone: "+91-98765-43210",
    url: "https://wheatraja.com"
  };
  return (
    <html lang="en">
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <SiteHeader />
        {children}
        <a href="https://wa.me/919876543210" className="fixed bottom-5 right-5 z-50 rounded-full bg-leaf px-5 py-3 text-sm font-bold text-white shadow-glow">WhatsApp</a>
        <SiteFooter />
      </body>
    </html>
  );
}
