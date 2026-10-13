"use client";

import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, readCart, summarizeCart } from "@/lib/cart";
import { csrfHeaders } from "@/lib/csrf";
import { products } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

const serviceAreas = [
  { label: "Sector 78 / 76 / 77", pincode: "201301", distance: 8 },
  { label: "Sector 137 / 142", pincode: "201304", distance: 18 },
  { label: "Noida Extension", pincode: "201305", distance: 28 },
  { label: "Indirapuram", pincode: "201009", distance: 34 },
  { label: "Outside 60 KM", pincode: "000000", distance: 61 }
];

type DeliveryQuote = { deliverable: boolean; charge: number | null; eta: string; distance_km: number };
type WalletQuote = { balance: number; enabled: boolean };
type OrderQuote = { subtotal: number; coupon_discount: number; delivery_charge: number; wallet_balance: number; wallet_applied: number; wallet_earned: number; free_gift: boolean; total: number; payable: number };
type RazorpayOrder = { mode: "live" | "demo" | "wallet"; order_id?: string; id?: string; razorpay_order_id?: string; amount: number; currency: string; key?: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function CheckoutClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [address, setAddress] = useState("");
  const [deliveryArea, setDeliveryArea] = useState(serviceAreas[0].label);
  const [coupon, setCoupon] = useState("SAVE05");
  const [referralCode, setReferralCode] = useState("");
  const [status, setStatus] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryQuote | null>(null);
  const [wallet, setWallet] = useState<WalletQuote | null>(null);
  const [walletAmount, setWalletAmount] = useState(0);
  const [quote, setQuote] = useState<OrderQuote | null>(null);

  useEffect(() => setItems(readCart()), []);
  const summary = summarizeCart(items, coupon);
  const selectedArea = serviceAreas.find((area) => area.label === deliveryArea) ?? serviceAreas[0];
  const payable = quote?.payable ?? (delivery?.charge === null ? null : summary.total + (delivery?.charge ?? 0));
  const orderItems = useMemo(() => items.map((item) => ({
    slug: item.slug,
    weight_kg: item.weight,
    quantity: item.quantity,
    subscription: Boolean(item.subscription)
  })), [items]);

  useEffect(() => {
    if (!items.length) return;
    const sessionId = window.localStorage.getItem("wr_session_id") || crypto.randomUUID();
    window.localStorage.setItem("wr_session_id", sessionId);
    fetch(`${apiBase}/growth/recovery/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({
        session_id: sessionId,
        phone: phone || null,
        items: orderItems,
        subtotal: summary.subtotal,
        checkout_started: true
      })
    }).catch(() => {});
  }, [items.length, orderItems, phone, summary.subtotal]);

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/delivery/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ pincode: selectedArea.pincode, distance_km: selectedArea.distance })
    })
      .then((response) => response.json())
      .then((data) => { if (active) setDelivery(data); })
      .catch(() => { if (active) setDelivery(null); });
    return () => { active = false; };
  }, [selectedArea.distance, selectedArea.pincode]);

  useEffect(() => {
    fetch(`${apiBase}/wallet`, { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then(setWallet)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!items.length || !delivery?.deliverable) {
      setQuote(null);
      return;
    }
    fetch(`${apiBase}/orders/quote`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ items: orderItems, coupon, distance_km: delivery.distance_km, wallet_amount: walletAmount })
    })
      .then((response) => response.ok ? response.json() : null)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [coupon, delivery, items.length, orderItems, walletAmount]);

  async function requestOtp() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBase}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not send OTP");
      setOtpSent(true);
      setStatus(data.dev_otp ? `Development OTP: ${data.dev_otp}` : "OTP sent");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    const response = await fetch(`${apiBase}/auth/otp/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ phone, otp })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Invalid OTP");
    return data;
  }

  async function syncGuestCartToBackend() {
    for (const item of items) {
      await fetch(`${apiBase}/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ slug: item.slug, weight_kg: item.weight, quantity: item.quantity, subscription: Boolean(item.subscription) })
      });
    }
  }

  function loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function openRazorpay(payment: RazorpayOrder, orderIdValue: string) {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) throw new Error("Could not load Razorpay checkout");
    const Razorpay = window.Razorpay;
    return new Promise<void>((resolve, reject) => {
      const instance = new Razorpay({
        key: payment.key,
        amount: payment.amount,
        currency: payment.currency,
        name: "Wheat Raja",
        description: `Order ${orderIdValue}`,
        order_id: payment.id,
        handler: async (response: any) => {
          const verify = await fetch(`${apiBase}/payments/razorpay/verify`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...csrfHeaders() },
            body: JSON.stringify({
              order_id: orderIdValue,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          if (!verify.ok) reject(new Error("Payment verification failed"));
          else resolve();
        },
        modal: {
          ondismiss: async () => {
            await fetch(`${apiBase}/payments/razorpay/failure`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", ...csrfHeaders() },
              body: JSON.stringify({ order_id: orderIdValue, reason: "checkout_dismissed" })
            }).catch(() => {});
            reject(new Error("Payment was not completed"));
          }
        }
      });
      instance.open();
    });
  }

  async function placeOrder() {
    if (!phone || !otp || !address || items.length === 0 || !delivery?.deliverable) {
      setStatus("Complete OTP, address, cart and serviceable delivery before payment.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await verifyOtp();
      await syncGuestCartToBackend();
      const orderResponse = await fetch(`${apiBase}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({
          items: orderItems,
          coupon,
          wallet_amount: walletAmount,
          distance_km: delivery.distance_km,
          address,
          delivery_area: deliveryArea,
          referral_code: referralCode.trim() || null
        })
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(order.detail || "Could not create order");
      if ((order.payable_amount ?? order.payable ?? 0) <= 0 || order.payment_status === "paid") {
        setOrderId(order.id);
        setStatus(`Wallet payment completed for backend order ${order.id}.`);
        clearCart();
        setItems([]);
        return;
      }
      const paymentResponse = await fetch(`${apiBase}/payments/razorpay/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ order_id: order.id })
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(payment.detail || "Could not create payment");
      if (payment.mode === "demo") {
        await fetch(`${apiBase}/payments/razorpay/verify`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", ...csrfHeaders() },
          body: JSON.stringify({
            order_id: order.id,
            razorpay_order_id: payment.razorpay_order_id,
            razorpay_payment_id: `demo_pay_${Date.now()}`,
            razorpay_signature: "demo-signature",
            demo: true
          })
        });
      } else if (payment.mode === "live") {
        await openRazorpay(payment, order.id);
      } else if (payment.mode === "wallet") {
        // Backend already marked this order paid via wallet balance.
      }
      setOrderId(order.id);
      setStatus(`${payment.mode === "demo" ? "Demo payment verified" : "Payment order created"} for backend order ${order.id}.`);
      clearCart();
      setItems([]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[1.1fr_.9fr]">
      <div className="grid gap-5">
        <div className="rounded-[18px] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur">
          <p className="text-sm font-bold text-wheat">01</p>
          <h2 className="mt-3 font-serif text-3xl text-forest">Phone OTP</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-full border border-mitti/15 px-4 py-3" placeholder="+91 mobile number" />
            <button onClick={requestOtp} disabled={loading || phone.length < 10} className="rounded-full bg-forest px-5 py-3 font-bold text-cream disabled:opacity-50">{loading ? "Sending..." : "Send OTP"}</button>
          </div>
          {otpSent ? <input value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-3 w-full rounded-full border border-mitti/15 px-4 py-3" placeholder="Enter OTP" /> : null}
        </div>
        <div className="rounded-[18px] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur">
          <p className="text-sm font-bold text-wheat">02</p>
          <h2 className="mt-3 font-serif text-3xl text-forest">Delivery Address</h2>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="mt-5 min-h-24 w-full rounded-[14px] border border-mitti/15 px-4 py-3" placeholder="House, society, sector, city, pincode" />
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <select value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)} className="rounded-full border border-mitti/15 bg-white px-4 py-3">
              {serviceAreas.map((area) => <option key={area.label}>{area.label}</option>)}
            </select>
            <p className={`rounded-full px-5 py-3 text-sm font-bold ${delivery?.deliverable ? "bg-leaf/10 text-leaf" : "bg-red-50 text-red-700"}`}>
              {!delivery ? "Checking..." : delivery.charge === null ? "Not deliverable" : delivery.charge === 0 ? "Free delivery" : `${formatPrice(delivery.charge)} delivery`}
            </p>
          </div>
          <p className="mt-3 text-sm font-semibold text-mitti/70">{delivery?.eta ?? "Checking ETA"}</p>
        </div>
        <div className="rounded-[18px] border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur">
          <p className="text-sm font-bold text-wheat">03</p>
          <h2 className="mt-3 font-serif text-3xl text-forest">Payment</h2>
          <div className="mt-4 flex items-start gap-3 rounded-[14px] bg-cream p-4 text-sm text-mitti">
            <ShieldCheck className="mt-1 text-leaf" size={20} />
            <p>Razorpay order is created server-side. If keys are missing locally, checkout uses clearly-labelled demo payment verification.</p>
          </div>
          <div className="mt-4 rounded-[14px] bg-white p-4 shadow-sm">
            <p className="font-semibold text-forest">Use WR Wallet</p>
            <p className="mt-1 text-sm text-mitti/70">Available: {formatPrice(wallet?.balance ?? quote?.wallet_balance ?? 0)}</p>
            <input type="number" min={0} max={wallet?.balance ?? 0} value={walletAmount} onChange={(e) => setWalletAmount(Math.max(0, Number(e.target.value || 0)))} className="mt-3 w-full rounded-full border border-mitti/15 px-4 py-3" placeholder="Wallet amount" />
          </div>
          <button onClick={placeOrder} disabled={!items.length || loading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 font-bold text-cream disabled:bg-mitti/25 disabled:text-mitti/50">
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Place Order
          </button>
          {status ? <p className="mt-4 rounded-[14px] bg-leaf/10 p-4 text-sm font-semibold text-leaf">{status}</p> : null}
        </div>
      </div>
      <aside className="h-fit rounded-[18px] border border-white/70 bg-white/90 p-6 shadow-card backdrop-blur">
        <p className="font-serif text-3xl text-forest">Fresh order summary</p>
        <div className="mt-5 grid gap-3">
          {!items.length && !orderId ? (
            <div className="rounded-[14px] bg-cream p-4 text-sm font-semibold text-mitti">
              <p>Your basket is empty. Add fresh atta before checkout.</p>
              <Link href="/products" className="mt-3 inline-flex rounded-full bg-forest px-4 py-2 text-sm font-bold text-cream">Shop products</Link>
            </div>
          ) : null}
          {items.map((item, index) => {
            const product = products.find((row) => row.slug === item.slug);
            if (!product) return null;
            return <p key={index} className="flex justify-between text-sm"><span>{product.name} ({item.weight} KG) x {item.quantity}</span><span>{item.subscription ? "Subscription" : "One-time"}</span></p>;
          })}
        </div>
        <input value={coupon} onChange={(e) => setCoupon(e.target.value)} className="mt-5 w-full rounded-full border border-mitti/15 px-4 py-3" placeholder="Coupon code" />
        <div className="mt-3 rounded-[14px] bg-cream p-4">
          <p className="text-sm font-semibold text-forest">Referral code</p>
          <p className="mt-1 text-xs text-mitti/70">Enter a 4-letter code before your first order to apply Refer & Earn.</p>
          <input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase().slice(0, 4))} maxLength={4} className="mt-3 w-full rounded-full border border-mitti/15 px-4 py-3 text-sm uppercase tracking-[0.18em]" placeholder="ABCD" />
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <p className="flex justify-between"><span>Subtotal</span><span>{formatPrice(summary.subtotal)}</span></p>
          <p className="flex justify-between text-leaf"><span>Discount</span><span>-{formatPrice(quote?.coupon_discount ?? summary.couponDiscount)}</span></p>
          <p className="flex justify-between"><span>Delivery</span><span>{delivery?.charge === null ? "Blocked" : formatPrice(quote?.delivery_charge ?? delivery?.charge ?? 0)}</span></p>
          <p className="flex justify-between text-leaf"><span>Wallet used</span><span>-{formatPrice(quote?.wallet_applied ?? 0)}</span></p>
          <p className="flex justify-between"><span>Wallet earned</span><span>{formatPrice(quote?.wallet_earned ?? summary.walletEarned)}</span></p>
          <p className="flex justify-between"><span>Gift eligibility</span><span>{(quote?.free_gift ?? summary.freeGift) ? "Included: 1 KG Multigrain" : "Available above Rs. 999"}</span></p>
          <p className="flex justify-between border-t border-mitti/10 pt-4 text-lg font-bold"><span>Payable</span><span>{payable === null ? "-" : formatPrice(payable ?? 0)}</span></p>
        </div>
        {orderId ? <p className="mt-5 flex items-center gap-2 rounded-[14px] bg-leaf/10 p-4 text-sm font-semibold text-leaf"><CheckCircle2 size={18} /> Backend order: {orderId}</p> : null}
      </aside>
    </section>
  );
}
