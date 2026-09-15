import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, ChevronDown } from "lucide-react";
import { useApp } from "../context";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
}

const BOT_ANSWERS: Record<string, string> = {
  track: "To track your order, go to your Dashboard → My Orders and click 'Track'. You can also visit the Order Tracking page directly. Your tracking ID is in your WhatsApp confirmation message.",
  delivery: "We deliver across NCR — Noida, Greater Noida, Ghaziabad, Delhi, Gurugram, and Faridabad. Free delivery within 20 km of our Sector 78 fulfillment center. Delivery time is 24–48 hours after milling.",
  product: "We offer three premium varieties: Multigrain Atta (7-grain blend), MP Sharbati Atta (premium Madhya Pradesh wheat), and Sehori Atta (heritage variety). All are stone-ground fresh after your order.",
  subscription: "Our subscriptions save you up to 15% with weekly, bi-weekly, or monthly delivery options. You can pause, skip, or cancel any time from your dashboard — no penalties.",
  refund: "We offer a 100% money-back guarantee on your first order. For other orders, contact us within 48 hours of delivery. Refunds are processed to your Wheat Raja Wallet within 24 hours.",
  wallet: "Your Wheat Raja Wallet lets you store money for easy checkout. Earn 2% cashback on every order. You can add money or use it for subscriptions. Minimum redemption is ₹100.",
  quality: "All our atta is NABL-certified tested for purity and adulterants before milling. We use Grade A wheat from certified farms. FSSAI License: 12345678901234.",
  hello: "Hello! I'm Atta Bot, your Wheat Raja assistant. How can I help you today? You can ask me about orders, delivery, products, subscriptions, or anything else.",
  hi: "Hi there! Great to see you. I'm here to help with any Wheat Raja questions — tracking, products, subscriptions, delivery and more!",
};

const QUICK_ACTIONS = [
  { label: "Track Order", key: "track" },
  { label: "Delivery Areas", key: "delivery" },
  { label: "Product Info", key: "product" },
  { label: "Subscription Help", key: "subscription" },
];

function getTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function getBotResponse(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("track") || lower.includes("order status")) return BOT_ANSWERS.track;
  if (lower.includes("deliver") || lower.includes("area") || lower.includes("pincode")) return BOT_ANSWERS.delivery;
  if (lower.includes("product") || lower.includes("atta") || lower.includes("multigrain") || lower.includes("sharbati")) return BOT_ANSWERS.product;
  if (lower.includes("subscri")) return BOT_ANSWERS.subscription;
  if (lower.includes("refund") || lower.includes("return") || lower.includes("cancel")) return BOT_ANSWERS.refund;
  if (lower.includes("wallet") || lower.includes("cashback") || lower.includes("point")) return BOT_ANSWERS.wallet;
  if (lower.includes("qualit") || lower.includes("pure") || lower.includes("certif") || lower.includes("nabl")) return BOT_ANSWERS.quality;
  if (lower.match(/^(hi|hello|hey)/)) return BOT_ANSWERS.hi;
  return "Thanks for your message! Our team will get back to you within a few hours. For faster help, WhatsApp us at +91 98765 43210. Is there anything else I can help with?";
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "Hello! I'm Atta Bot — your Wheat Raja assistant. How can I help you today?",
    time: getTime(),
  },
];

export function Chatbot() {
  const { page } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Don't show on admin
  if (page === "admin") return null;

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), from: "user", text: text.trim(), time: getTime() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const botMsg: Message = { id: Date.now() + 1, from: "bot", text: getBotResponse(text), time: getTime() };
      setMessages((m) => [...m, botMsg]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Open chat"}
        className={`fixed z-50 w-14 h-14 bg-amber-600 hover:bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 bottom-6 left-5`}
        style={{ bottom: "24px", left: "20px" }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">!</span>
        )}
      </button>

      {/* Chat panel */}
      <div
        className="fixed z-50 shadow-2xl rounded-2xl overflow-hidden border border-border transition-all duration-300 origin-bottom-left"
        style={{
          bottom: "88px",
          left: "20px",
          width: "360px",
          maxHeight: open ? "520px" : "0px",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transform: open ? "scale(1)" : "scale(0.9)",
        }}
      >
        {/* Header */}
        <div className="bg-amber-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Atta Bot</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
                <span className="text-amber-100 text-xs">Online · Replies instantly</span>
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="bg-white flex flex-col" style={{ height: "360px" }}>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                {msg.from === "bot" && (
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-amber-700" />
                  </div>
                )}
                <div className={`max-w-[240px] ${msg.from === "user" ? "" : ""}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.from === "user" ? "bg-amber-600 text-white rounded-tr-sm" : "bg-stone-100 text-stone-800 rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-stone-400 mt-0.5 ${msg.from === "user" ? "text-right" : ""}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-700" />
                </div>
                <div className="bg-stone-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={() => sendMessage(action.label)}
                className="text-[10px] font-semibold text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-full transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="border-t border-stone-100 px-3 py-3 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 bg-amber-600 disabled:bg-stone-200 hover:bg-amber-700 text-white rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
