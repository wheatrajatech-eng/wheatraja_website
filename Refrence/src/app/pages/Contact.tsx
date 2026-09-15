import { useState } from "react";
import { motion } from "motion/react";
import { Phone, Mail, MapPin, MessageCircle, Clock, ChevronRight, Check, Send } from "lucide-react";
import { useApp } from "../context";

const CONTACT_CARDS = [
  {
    icon: Phone,
    label: "Call Us",
    primary: "+91 98765 43210",
    secondary: "Mon–Sat, 9 AM – 7 PM",
    action: "tel:+919876543210",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    iconBg: "bg-blue-100",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    primary: "+91 98765 43210",
    secondary: "Typically replies in 15 min",
    action: "https://wa.me/919876543210",
    color: "bg-green-50 border-green-200 text-green-700",
    iconBg: "bg-green-100",
  },
  {
    icon: Mail,
    label: "Email Us",
    primary: "care@wheatraja.com",
    secondary: "Response within 4 hours",
    action: "mailto:care@wheatraja.com",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    iconBg: "bg-amber-100",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    primary: "Sector 78, Noida",
    secondary: "UP 201301, India",
    action: null,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    iconBg: "bg-purple-100",
  },
];

const QUICK_LINKS = [
  "Track my order",
  "Subscription management",
  "Delivery area check",
  "Product quality queries",
  "Bulk / corporate orders",
  "Refund & returns",
];

const OFFICE_HOURS = [
  { day: "Monday – Friday", hours: "9:00 AM – 7:00 PM" },
  { day: "Saturday", hours: "9:00 AM – 5:00 PM" },
  { day: "Sunday", hours: "Closed" },
  { day: "WhatsApp Support", hours: "9:00 AM – 9:00 PM daily" },
];

const SUBJECTS = [
  "Order Query",
  "Delivery Issue",
  "Product Quality",
  "Subscription Help",
  "Bulk Order",
  "Feedback",
  "Other",
];

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.45, ease: "easeOut" } };

export function Contact() {
  const { navigate } = useApp();
  const [form, setForm] = useState({ name: "", contact: "", subject: SUBJECTS[0], message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.contact.trim()) errs.contact = "Email or phone is required";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.trim().length < 20) errs.message = "Please write at least 20 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero */}
      <section className="bg-stone-900 py-20 px-5 md:px-10 text-center">
        <motion.div {...fade}>
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white mb-4">We're Here for You</h1>
          <p className="text-white/60 text-lg max-w-lg mx-auto">Questions, feedback, or just want to say hello — our team responds within a few hours.</p>
        </motion.div>
      </section>

      {/* Contact cards */}
      <section className="py-14 px-5 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {CONTACT_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                {card.action ? (
                  <a
                    href={card.action}
                    target={card.action.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`block border-2 rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${card.color}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-stone-900 text-xs mb-1">{card.label}</p>
                    <p className="font-semibold text-stone-800 text-sm">{card.primary}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{card.secondary}</p>
                  </a>
                ) : (
                  <div className={`border-2 rounded-2xl p-5 ${card.color}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-stone-900 text-xs mb-1">{card.label}</p>
                    <p className="font-semibold text-stone-800 text-sm">{card.primary}</p>
                    <p className="text-stone-500 text-xs mt-0.5">{card.secondary}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Main grid: form + info */}
          <div className="grid md:grid-cols-5 gap-10">
            {/* Form */}
            <motion.div {...fade} className="md:col-span-3">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Send Us a Message</h2>
              {submitted ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-10 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Message Sent!</h3>
                  <p className="text-stone-600 text-sm mb-4">We've received your message and will respond within 4 hours during business hours.</p>
                  <button onClick={() => setSubmitted(false)} className="text-sm text-amber-700 font-semibold hover:underline">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Full Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Rohit Sharma"
                        className={`w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors ${errors.name ? "border-red-400" : "border-border"}`}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Email or Phone *</label>
                      <input
                        value={form.contact}
                        onChange={(e) => setForm({ ...form, contact: e.target.value })}
                        placeholder="you@email.com or +91 98765..."
                        className={`w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors ${errors.contact ? "border-red-400" : "border-border"}`}
                      />
                      {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full bg-stone-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      className={`w-full bg-stone-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none ${errors.message ? "border-red-400" : "border-border"}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.message ? <p className="text-red-500 text-xs">{errors.message}</p> : <span />}
                      <p className="text-xs text-muted-foreground">{form.message.length} chars</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Send className="w-4 h-4" /> Send Message
                  </button>
                </form>
              )}
            </motion.div>

            {/* Info panel */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="md:col-span-2 space-y-5"
            >
              {/* Office hours */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-stone-900 text-sm">Office Hours</h3>
                </div>
                <div className="space-y-2">
                  {OFFICE_HOURS.map((oh) => (
                    <div key={oh.day} className="flex justify-between text-sm">
                      <span className="text-stone-600">{oh.day}</span>
                      <span className={`font-medium ${oh.hours === "Closed" ? "text-red-500" : "text-stone-900"}`}>{oh.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map visual */}
              <div className="bg-stone-100 rounded-2xl overflow-hidden h-44 relative">
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                  <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-stone-900 text-sm">Wheat Raja Fulfillment Center</p>
                    <p className="text-stone-500 text-xs">Sector 78, Noida, UP 201301</p>
                  </div>
                </div>
                <div className="absolute inset-0 opacity-10">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="absolute border-stone-400 border-r" style={{ left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0 }} />
                  ))}
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="absolute border-stone-400 border-b w-full" style={{ top: `${(i + 1) * 20}%` }} />
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-semibold text-stone-900 text-sm mb-4">Quick Help Topics</h3>
                <div className="space-y-1">
                  {QUICK_LINKS.map((link) => (
                    <button
                      key={link}
                      onClick={() => setForm({ ...form, subject: link.includes("order") ? "Order Query" : link.includes("Subscription") ? "Subscription Help" : link.includes("quality") ? "Product Quality" : link.includes("Bulk") ? "Bulk Order" : link.includes("Refund") ? "Feedback" : "Other" })}
                      className="w-full flex items-center justify-between py-2 text-left text-sm text-stone-600 hover:text-amber-700 transition-colors group"
                    >
                      <span>{link}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
