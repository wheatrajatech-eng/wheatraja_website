import { MapPin, Phone, Package, Truck, Check, Clock, ArrowLeft, MessageCircle } from "lucide-react";
import { useApp } from "../context";
import { CURRENT_ORDER } from "../data";

const STATUS_ICONS = {
  "Order Received": Package,
  "Milling Started": Clock,
  "Order Packed": Package,
  "Out for Delivery": Truck,
  "Delivered": Check,
};

export function Tracking() {
  const { navigate } = useApp();
  const order = CURRENT_ORDER;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-2xl mx-auto px-5 md:px-10 py-10">
        <button onClick={() => navigate("dashboard")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Order Tracking</h1>
        <p className="text-muted-foreground text-sm mb-8">Order #{order.id}</p>

        {/* Status banner */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-6 h-6" />
            <span className="font-bold text-lg">Out for Delivery</span>
          </div>
          <p className="text-blue-100 text-sm">Your fresh atta is on its way! Expected delivery by <strong>1:00 PM today</strong></p>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-stone-900 mb-6">Order Timeline</h2>
          <div className="relative">
            {order.steps.map((step, i) => {
              const Icon = STATUS_ICONS[step.label as keyof typeof STATUS_ICONS] ?? Check;
              const isLast = i === order.steps.length - 1;
              return (
                <div key={step.label} className="flex gap-4 relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div className={`absolute left-5 top-10 w-0.5 h-full ${step.done ? "bg-amber-400" : "bg-stone-200"}`} style={{ height: "calc(100% - 20px)" }} />
                  )}
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${step.done ? (isLast ? "bg-stone-200 border-2 border-dashed border-stone-300" : "bg-amber-500") : "bg-stone-100"}`}>
                    <Icon className={`w-5 h-5 ${step.done && !isLast ? "text-white" : step.done && isLast ? "text-stone-400" : "text-stone-400"}`} />
                  </div>
                  {/* Content */}
                  <div className="pb-8">
                    <p className={`font-semibold text-sm ${step.done && !isLast ? "text-stone-900" : step.done && isLast ? "text-stone-500" : "text-stone-400"}`}>{step.label}</p>
                    <p className={`text-xs mt-0.5 ${step.done ? "text-muted-foreground" : "text-stone-300"}`}>{step.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery agent */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">Delivery Agent</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-lg">
              {order.delivery.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-900">{order.delivery.name}</p>
              <p className="text-xs text-muted-foreground">{order.delivery.vehicle}</p>
            </div>
            <a
              href={`tel:${order.delivery.phone}`}
              className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
            >
              <Phone className="w-5 h-5 text-green-700" />
            </a>
            <a
              href={`https://wa.me/${order.delivery.phone.replace(/\D/g, "")}`}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-stone-900 mb-4">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-medium">{order.product}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-medium">{order.qty} bag</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">₹{order.total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Placed At</span><span className="font-medium">{order.placedAt}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
