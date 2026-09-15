export type AdminModuleKey =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "payments"
  | "refunds"
  | "returns"
  | "inventory"
  | "shipments"
  | "coupons"
  | "subscriptions"
  | "wallet"
  | "banners"
  | "blogs"
  | "reviews"
  | "contact"
  | "reports"
  | "settings"
  | "users"
  | "roles"
  | "notifications"
  | "reminderOutbox"
  | "reminderOutboxFailed"
  | "audit"
  | "referrals"
  | "support"
  | "recoveries"
  | "loyalty"
  | "deliverySlots"
  | "tasks"
  | "readiness";

export type AdminModule = {
  key: AdminModuleKey;
  label: string;
  href: string;
  endpoint?: string;
  description: string;
  icon: string;
};

export const adminModules: AdminModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", endpoint: "/admin/summary", description: "KPI summary, recent orders and product mix.", icon: "LayoutDashboard" },
  { key: "products", label: "Products", href: "/products", endpoint: "/admin/products", description: "Catalog, variants and storefront product state.", icon: "Package" },
  { key: "categories", label: "Categories", href: "/categories", endpoint: "/categories", description: "Catalog groupings used across the storefront.", icon: "Tags" },
  { key: "orders", label: "Orders", href: "/orders", endpoint: "/admin/orders", description: "Order lifecycle, fulfilment state and payment state.", icon: "ShoppingCart" },
  { key: "customers", label: "Customers", href: "/customers", endpoint: "/admin/customers", description: "Customer accounts, profile state and wallet balances.", icon: "Users" },
  { key: "payments", label: "Payments", href: "/payments", endpoint: "/admin/payments", description: "Payment attempts, provider references and settlement state.", icon: "CreditCard" },
  { key: "refunds", label: "Refunds", href: "/refunds", endpoint: "/admin/refunds", description: "Refund requests and refund processing status.", icon: "ReceiptText" },
  { key: "returns", label: "Returns", href: "/returns", endpoint: "/admin/returns", description: "Customer return requests and return item status.", icon: "Undo2" },
  { key: "inventory", label: "Inventory", href: "/inventory", endpoint: "/inventory", description: "Variant stock, reservations and low-stock review.", icon: "Warehouse" },
  { key: "shipments", label: "Shipments", href: "/shipments", endpoint: "/admin/shipments", description: "Tracking numbers, carrier data and shipment events.", icon: "Truck" },
  { key: "coupons", label: "Coupons", href: "/coupons", endpoint: "/admin/coupons", description: "Promotions, code usage and discount controls.", icon: "BadgePercent" },
  { key: "subscriptions", label: "Subscriptions", href: "/subscriptions", endpoint: "/admin/subscriptions", description: "Recurring order plans and delivery schedule state.", icon: "RefreshCw" },
  { key: "wallet", label: "Wallet", href: "/wallet", endpoint: "/admin/wallet", description: "Wallet balances and liability overview.", icon: "WalletCards" },
  { key: "banners", label: "Banners", href: "/banners", endpoint: "/admin/banners", description: "Storefront campaign banners.", icon: "Image" },
  { key: "blogs", label: "Blogs", href: "/blogs", endpoint: "/admin/blogs", description: "Content posts and publishing state.", icon: "Newspaper" },
  { key: "reviews", label: "Reviews", href: "/reviews", endpoint: "/admin/reviews", description: "Customer review moderation.", icon: "Star" },
  { key: "contact", label: "Contact", href: "/contact", endpoint: "/admin/contact", description: "Leads, contact requests and support queue.", icon: "Inbox" },
  { key: "reports", label: "Reports", href: "/reports", endpoint: "/admin/analytics", description: "Revenue, products, subscriptions and operational analytics.", icon: "BarChart3" },
  { key: "settings", label: "Settings", href: "/settings", endpoint: "/settings", description: "Site, delivery, reminder, payment and operational settings.", icon: "Settings" },
  { key: "users", label: "Users", href: "/users", endpoint: "/admin/customers", description: "Administrative view of customer and staff identities.", icon: "UserCog" },
  { key: "roles", label: "Roles", href: "/roles", endpoint: "/admin/roles", description: "Roles and permissions used by the admin surface.", icon: "ShieldCheck" },
  { key: "notifications", label: "Notifications", href: "/notifications", endpoint: "/admin/notification-events", description: "Notification delivery events and admin messages.", icon: "Bell" },
  { key: "reminderOutbox", label: "Reminder Outbox", href: "/reminder-outbox", endpoint: "/reminders/admin/outbox", description: "Queued reminder deliveries, retries and payload preview.", icon: "Inbox" },
  { key: "reminderOutboxFailed", label: "Reminder Failures", href: "/reminder-outbox/failed", endpoint: "/reminders/admin/outbox?status=failed", description: "Failed reminder deliveries, resend history and bulk retry actions.", icon: "TriangleAlert" },
  { key: "audit", label: "Audit", href: "/audit", endpoint: "/admin/audit", description: "Administrative actions and operational audit records.", icon: "FileClock" },
  { key: "referrals", label: "Referrals", href: "/referrals", endpoint: "/admin/referrals", description: "Referral activity and reward operations.", icon: "Gift" },
  { key: "support", label: "Support", href: "/support", endpoint: "/admin/support", description: "Customer support tickets and resolution state.", icon: "LifeBuoy" },
  { key: "recoveries", label: "Recoveries", href: "/recoveries", endpoint: "/admin/recoveries", description: "Abandoned cart and checkout recovery opportunities.", icon: "ShoppingBag" },
  { key: "loyalty", label: "Loyalty", href: "/loyalty", endpoint: "/admin/loyalty", description: "WR Wallet tiers, rewards and retention controls.", icon: "Crown" },
  { key: "deliverySlots", label: "Delivery Slots", href: "/delivery-slots", endpoint: "/admin/delivery-slots", description: "Delivery slot capacity and route windows.", icon: "CalendarClock" },
  { key: "tasks", label: "Task Center", href: "/tasks", endpoint: "/growth/admin/tasks", description: "Operational launch queue for stock, support, refunds and content.", icon: "ListChecks" },
  { key: "readiness", label: "Readiness", href: "/readiness", endpoint: "/admin/readiness", description: "Production readiness checks exposed by the API.", icon: "CheckCircle2" }
];

export function getAdminModule(key: AdminModuleKey) {
  return adminModules.find((module) => module.key === key) ?? adminModules[0];
}
