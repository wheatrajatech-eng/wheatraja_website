import Link from "next/link";

function slugFor(item: string) {
  const custom: Record<string, string> = {
    Overview: "",
    "My Orders": "orders",
    "Order Tracking": "tracking",
    "Saved Addresses": "addresses",
    "My Subscriptions": "subscriptions",
    "WR Wallet": "wallet",
    "Refer & Earn": "refer",
    "Variants & Inventory": "inventory",
    Inventory: "inventory",
    "Delivery Radius": "delivery-radius",
    "Delivery Rules": "delivery-rules",
    "Subscription Management": "subscriptions",
    "Wallet Controls": "wallet",
    "Referral Controls": "referrals",
    "Reviews Moderation": "reviews",
    "Reviews Approval": "reviews",
    Banners: "banners",
    "Blogs / Recipes": "blog",
    "Customer Queries": "queries",
    "Blog CMS": "blog",
  };
  return custom[item] ?? item.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-");
}

export function DashboardGrid({ title, items, basePath }: { title: string; items: string[]; basePath?: string }) {
  const descriptions: Record<string, string> = {
    Overview: "Live health, quick actions and the next work queue.",
    "My Orders": "Fresh atta orders, invoices and one-tap reorder.",
    "Order Tracking": "Milling, packing and delivery timeline for every order.",
    "Saved Addresses": "Home, office and society delivery preferences.",
    "My Subscriptions": "Monthly atta plans, pauses and next delivery dates.",
    "WR Wallet": "Points ledger, redemption threshold and earned rewards.",
    "Refer & Earn": "Personal referral code and invite rewards.",
    Profile: "Name, phone, notification and family preference settings.",
    Orders: "Queue, status changes, packing labels and fulfilment control.",
    Products: "Catalog, pricing, proof badges and product content.",
    "Variants & Inventory": "Stock, batch labels, milling capacity and low-stock alerts.",
    Inventory: "Stock, batch labels, milling capacity and low-stock alerts.",
    Customers: "Repeat buyers, sectors, subscriptions and support notes.",
    Coupons: "Rules, usage limits, expiry and redemption audit.",
    Offers: "Bundles, free gifts and subscription incentives.",
    Banners: "Homepage offers, SAVE05 content and seasonal campaign slots.",
    "Delivery Radius": "Serviceable sectors, charges, overrides and route notes.",
    "Delivery Rules": "Serviceable sectors, charges, overrides and route notes.",
    Subscriptions: "Active plans, upcoming deliveries and pause requests.",
    Wallet: "Points issuance, redemptions and manual adjustment audit.",
    Referrals: "Referral codes, reward status and fraud checks.",
    Reviews: "Verified buyer moderation and homepage/PDP publishing.",
    "Reviews Approval": "Verified buyer moderation and homepage/PDP publishing.",
    "Blog CMS": "SEO articles, product links, schema and publishing workflow.",
    "Blogs / Recipes": "SEO articles, recipes, product links and schema publishing.",
    "Customer Queries": "Contact requests, WhatsApp leads and bulk inquiry routing.",
    Notifications: "WhatsApp, SMS and email templates for lifecycle updates.",
    Analytics: "Revenue, repeat purchase, SKU mix and delivery performance.",
    Settings: "Compliance, FSSAI proof, payment keys and operational gates."
  };
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const slug = slugFor(item);
          const href = basePath ? (slug ? `${basePath}/${slug}` : basePath) : "#";
          return (
            <Link href={href} key={item} className="group rounded-[8px] border border-mitti/10 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-wheat/60">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-clay">{title}</p>
              <h2 className="mt-4 font-serif text-3xl text-forest">{item}</h2>
              <p className="mt-3 text-sm leading-6 text-mitti/65">{descriptions[item] ?? "Operational controls, records, exports and audit history."}</p>
              <p className="mt-5 text-sm font-bold text-forest group-hover:text-mitti">Open workspace</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
