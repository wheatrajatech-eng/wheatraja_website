export type ApiUser = {
  phone: string;
  role: "customer" | "admin" | "superadmin";
  name?: string | null;
  email?: string | null;
  profile_complete?: boolean;
  referral_code?: string | null;
  wallet_points?: number;
};

export type ProductVariant = {
  id: number;
  weight_kg: number;
  price: number;
  inventory: number;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  variants: ProductVariant[];
  images?: Array<{ id: number; url: string; alt: string }>;
};

export type OrderItem = {
  slug: string;
  name: string;
  weight_kg: number;
  quantity: number;
  unit_price: number;
  subscription: boolean;
};

export type Order = {
  id: string;
  database_id: number;
  phone: string;
  address: string;
  delivery_area: string;
  delivery_eta: string;
  status: string;
  payment_status: string;
  subtotal: number;
  coupon_discount: number;
  delivery_charge: number;
  wallet_amount?: number;
  payable_amount?: number;
  total: number;
  created_at: string;
  items: OrderItem[];
};

export type AdminSummary = {
  metrics: {
    revenue: number;
    orders: number;
    customers: number;
    subscriptions: number;
    total_products?: number;
    total_orders?: number;
    total_revenue?: number;
    pending_orders?: number;
    low_stock_products?: number;
    new_contact_leads?: number;
    wallet_liability?: number;
    subscription_due?: number;
  };
  recent_orders: Order[];
  product_mix: Array<{ name: string; count: number }>;
};

export type WalletLedger = {
  enabled: boolean;
  balance: number;
  transactions: Array<{
    id: number;
    amount: number;
    transaction_type: string;
    reason: string;
    order_id?: number | null;
    created_at: string;
  }>;
};

export type Subscription = {
  id: number;
  slug: string;
  name: string;
  weight_kg: number;
  quantity: number;
  cadence: "15_days" | "30_days" | string;
  discount_percent: number;
  amount?: number;
  next_delivery_at?: string | null;
  wallet_auto_deduct: boolean;
  status: string;
  active: boolean;
  created_at?: string | null;
  deliveries?: SubscriptionDelivery[];
};

export type SubscriptionDelivery = {
  id: number;
  subscription_id: number;
  order_id?: string | null;
  scheduled_for: string;
  status: "scheduled" | "skipped" | "payment_due" | "paid" | "delivered" | string;
  wallet_amount: number;
  payable_amount: number;
  note?: string | null;
  created_at?: string | null;
};

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: "Blog" | "News" | "Article" | string;
  read_time?: string | null;
  cover_image_url?: string | null;
  published: boolean;
  created_at?: string | null;
};
