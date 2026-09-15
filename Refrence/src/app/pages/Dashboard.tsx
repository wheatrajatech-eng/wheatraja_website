import { useState } from "react";
import {
  ShoppingBag, RefreshCw, Wallet, Gift, MapPin,
  Star, Settings, LogOut, Plus, Pause,
  Play, X, Copy, Share2, MessageCircle, Check,
  Package, Truck, TrendingUp, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { useApp } from "../context";
import { ORDERS, SUBSCRIPTIONS, WALLET_TXS, REVIEWS } from "../data";
import { StatusBadge, StarRow } from "../shared";

// Re-export from data for convenience
export { };

type DashTab = "overview" | "orders" | "subscriptions" | "wallet" | "referral" | "addresses" | "reviews" | "settings";

const NAV_ITEMS: { id: DashTab; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: TrendingUp },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "referral", label: "Refer & Earn", icon: Gift },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "reviews", label: "My Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

const ADDRESSES = [
  { id: 1, label: "Home", name: "Rohit Sharma", line: "45-B, Sector 45", city: "Noida", pin: "201301", phone: "9812345670", isDefault: true },
  { id: 2, label: "Work", name: "Rohit Sharma", line: "Building 7, Sector 63 IT Park", city: "Noida", pin: "201307", phone: "9812345670", isDefault: false },
];

const PRESET_AMOUNTS = [100, 200, 500, 1000];

export function Dashboard() {
  const { navigate, user, logout, walletBalance, depositToWallet, withdrawFromWallet } = useApp();
  const [tab, setTab] = useState<DashTab>("overview");
  const [walletModal, setWalletModal] = useState<"deposit" | "withdraw" | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletSuccess, setWalletSuccess] = useState("");

  const displayName = user?.name ?? "Rohit Sharma";

  const handleLogout = () => { logout(); navigate("home"); };

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
              {/* User info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-lg">
                  {displayName[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900 text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.phone ?? "+91 98123 45670"}</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${tab === id ? "text-amber-600" : "text-stone-400"}`} />
                    {label}
                  </button>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all mt-2">
                  <LogOut className="w-4 h-4 shrink-0" /> Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Mobile tab switcher */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-6">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${tab === id ? "bg-amber-600 text-white" : "bg-card border border-border text-stone-600"}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {tab === "overview" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Good morning, {displayName.split(" ")[0]}! 👋</h1>
                <p className="text-muted-foreground text-sm mb-7">Here's a summary of your Wheat Raja account.</p>

                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Total Orders", val: "12", icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
                    { label: "Active Subscriptions", val: "2", icon: RefreshCw, color: "bg-green-50 text-green-600" },
                    { label: "Wallet Balance", val: `₹${walletBalance}`, icon: Wallet, color: "bg-amber-50 text-amber-600" },
                    { label: "Points Earned", val: "840 pts", icon: Star, color: "bg-purple-50 text-purple-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-stone-900 text-xl">{s.val}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Active order */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-bold">Active Order — Out for Delivery</span>
                  </div>
                  <p className="text-blue-100 text-sm mb-4">MP Sharbati Atta 5 kg · Expected by 1 PM today</p>
                  <button onClick={() => navigate("tracking")} className="text-xs font-bold bg-white text-blue-700 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
                    Track Order →
                  </button>
                </div>

                {/* Recent orders */}
                <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-stone-900">Recent Orders</h2>
                    <button onClick={() => setTab("orders")} className="text-xs text-amber-700 font-semibold hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {ORDERS.slice(0, 2).map((o) => (
                      <div key={o.id} className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl">
                        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0"><Package className="w-4.5 h-4.5 text-amber-700" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 text-sm truncate">{o.items[0].name}</p>
                          <p className="text-xs text-muted-foreground">{o.date} · ₹{o.total}</p>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "My Wallet", icon: Wallet, tab: "wallet" as DashTab },
                    { label: "Refer Friends", icon: Gift, tab: "referral" as DashTab },
                    { label: "Subscriptions", icon: RefreshCw, tab: "subscriptions" as DashTab },
                    { label: "My Addresses", icon: MapPin, tab: "addresses" as DashTab },
                  ].map((q) => (
                    <button key={q.label} onClick={() => setTab(q.tab)} className="bg-card border border-border rounded-xl p-4 text-left hover:border-amber-300 transition-colors group">
                      <q.icon className="w-5 h-5 text-amber-600 mb-2" />
                      <p className="font-semibold text-stone-900 text-xs">{q.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">My Orders</h1>
                <div className="space-y-4">
                  {ORDERS.map((o) => (
                    <div key={o.id} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-bold text-stone-900 text-sm">#{o.id}</p>
                          <p className="text-xs text-muted-foreground">{o.date}</p>
                        </div>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="space-y-2 mb-4">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-stone-600">{item.name} × {item.qty}</span>
                            <span className="font-medium">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <div className="text-sm"><span className="text-muted-foreground">Total: </span><span className="font-bold text-stone-900">₹{o.total}</span></div>
                        <div className="flex gap-2">
                          {o.status === "out_for_delivery" && (
                            <button onClick={() => navigate("tracking")} className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors">Track</button>
                          )}
                          <button className="text-xs font-bold text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-50 transition-colors">Reorder</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTIONS ── */}
            {tab === "subscriptions" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-serif text-2xl font-bold text-stone-900">My Subscriptions</h1>
                  <button className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </div>

                <div className="space-y-5">
                  {SUBSCRIPTIONS.map((sub) => (
                    <div key={sub.id} className="bg-card border border-border rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-stone-900">{sub.product}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {sub.frequency === "biweekly" ? "Bi-Weekly" : sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)} · Started {sub.startDate}
                          </p>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-5 bg-stone-50 rounded-xl p-4">
                        <div className="text-center">
                          <p className="font-bold text-stone-900 text-lg">₹{sub.price}</p>
                          <p className="text-xs text-muted-foreground">Per delivery</p>
                        </div>
                        <div className="text-center border-x border-border">
                          <p className="font-bold text-green-700 text-lg">10%</p>
                          <p className="text-xs text-muted-foreground">Discount</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-stone-900 text-sm">{sub.nextDelivery}</p>
                          <p className="text-xs text-muted-foreground">Next delivery</p>
                        </div>
                      </div>

                      {/* Upcoming deliveries */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Upcoming Deliveries</p>
                        <div className="flex gap-2 flex-wrap">
                          {[sub.nextDelivery, "15 Jul 2024", "15 Aug 2024"].map((d, i) => (
                            <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-medium ${i === 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-stone-100 text-stone-600"}`}>
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {sub.status === "active"
                          ? <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-2 rounded-full hover:bg-amber-50 transition-colors"><Pause className="w-3.5 h-3.5" /> Pause</button>
                          : <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-300 px-3 py-2 rounded-full hover:bg-green-50 transition-colors"><Play className="w-3.5 h-3.5" /> Resume</button>}
                        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 border border-border px-3 py-2 rounded-full hover:bg-stone-50 transition-colors">Skip Next</button>
                        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-3 py-2 rounded-full hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /> Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── WALLET ── */}
            {tab === "wallet" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">My Wallet</h1>

                {/* Balance card */}
                <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-7 text-white mb-6">
                  <div className="flex items-center gap-2 mb-4 text-amber-200 text-xs font-bold uppercase tracking-widest">
                    <Wallet className="w-4 h-4" /> Wheat Raja Wallet
                  </div>
                  <p className="font-serif font-bold text-5xl mb-1">₹{walletBalance.toLocaleString("en-IN")}</p>
                  <p className="text-amber-200 text-sm">= {walletBalance} Points · 1 Point = ₹1</p>
                  <div className="mt-5 pt-5 border-t border-amber-500/50 flex items-center gap-3">
                    <button
                      onClick={() => { setWalletModal("deposit"); setWalletError(""); setWalletSuccess(""); setCustomAmount(""); }}
                      className="bg-white text-amber-700 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-amber-50 transition-colors flex items-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-4 h-4" /> Add Money
                    </button>
                    <button
                      onClick={() => { setWalletModal("withdraw"); setWalletError(""); setWalletSuccess(""); setCustomAmount(""); }}
                      className="bg-amber-500/30 hover:bg-amber-500/50 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors flex items-center gap-1.5 border border-white/30"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Withdraw
                    </button>
                  </div>
                </div>

                {/* Modal */}
                {walletModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setWalletModal(null)}>
                    <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-serif font-bold text-stone-900 text-lg">{walletModal === "deposit" ? "Add Money to Wallet" : "Withdraw from Wallet"}</h3>
                        <button onClick={() => setWalletModal(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                      </div>
                      {walletModal === "deposit" && (
                        <p className="text-xs text-muted-foreground mb-4">Choose a preset amount or enter a custom amount</p>
                      )}
                      {walletModal === "withdraw" && (
                        <p className="text-xs text-muted-foreground mb-4">Available balance: <strong className="text-stone-900">₹{walletBalance}</strong></p>
                      )}
                      {walletSuccess ? (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-6 h-6 text-green-600" /></div>
                          <p className="text-green-700 font-semibold">{walletSuccess}</p>
                          <button className="mt-4 text-sm text-amber-700 font-semibold hover:underline" onClick={() => { setWalletModal(null); setWalletSuccess(""); }}>Close</button>
                        </div>
                      ) : (
                        <>
                          {walletModal === "deposit" && (
                            <div className="grid grid-cols-4 gap-2 mb-4">
                              {PRESET_AMOUNTS.map((amt) => (
                                <button
                                  key={amt}
                                  onClick={() => setCustomAmount(String(amt))}
                                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${customAmount === String(amt) ? "bg-amber-600 text-white border-amber-600" : "border-border text-stone-700 hover:border-amber-400"}`}
                                >
                                  ₹{amt}
                                </button>
                              ))}
                            </div>
                          )}
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder={walletModal === "deposit" ? "Enter amount (₹)" : `Max ₹${walletBalance}`}
                            min={1}
                            max={walletModal === "withdraw" ? walletBalance : undefined}
                            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 mb-3"
                          />
                          {walletError && <p className="text-red-500 text-xs mb-3">{walletError}</p>}
                          <button
                            onClick={() => {
                              const amt = Number(customAmount);
                              if (!amt || amt <= 0) { setWalletError("Please enter a valid amount"); return; }
                              if (walletModal === "deposit") {
                                depositToWallet(amt);
                                setWalletSuccess(`₹${amt} added to your wallet!`);
                              } else {
                                const ok = withdrawFromWallet(amt);
                                if (!ok) { setWalletError("Insufficient wallet balance"); return; }
                                setWalletSuccess(`₹${amt} withdrawn successfully!`);
                              }
                              setWalletError("");
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors"
                          >
                            {walletModal === "deposit" ? "Add Money" : "Withdraw"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* How to earn */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { emoji: "🛒", title: "Shop & Earn", desc: "2% cashback on every order" },
                    { emoji: "👥", title: "Refer Friends", desc: "100 pts per successful referral" },
                    { emoji: "⭐", title: "Write Reviews", desc: "25 pts per verified review" },
                  ].map((i) => (
                    <div key={i.title} className="bg-card border border-border rounded-xl p-4 text-center">
                      <div className="text-3xl mb-2">{i.emoji}</div>
                      <p className="font-semibold text-stone-900 text-sm">{i.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{i.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Transactions */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-stone-900 mb-4">Transaction History</h2>
                  <div className="space-y-3">
                    {WALLET_TXS.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                          {tx.type === "credit" ? <TrendingUp className="w-4 h-4 text-green-600" /> : <Wallet className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 text-sm truncate">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                          {tx.type === "credit" ? "+" : ""}{tx.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── REFERRAL ── */}
            {tab === "referral" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Refer &amp; Earn</h1>

                {/* Referral card */}
                <div className="bg-stone-900 text-white rounded-2xl p-7 mb-6">
                  <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Your Referral Code</p>
                  <div className="bg-white/10 border border-white/20 rounded-xl flex items-center justify-between px-5 py-4 mb-5">
                    <span className="font-serif font-bold text-amber-400 text-2xl tracking-widest">RAJA2024</span>
                    <button className="text-xs text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-5">
                    {[{ l: "Friends Invited", v: "12" }, { l: "Orders Placed", v: "8" }, { l: "Points Earned", v: "800" }].map((s) => (
                      <div key={s.l}><p className="font-bold text-white text-xl">{s.v}</p><p className="text-white/50 text-xs mt-0.5">{s.l}</p></div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4" /> Share on WhatsApp
                    </button>
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      <Share2 className="w-4 h-4" /> Share Link
                    </button>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                  <h2 className="font-semibold text-stone-900 mb-4">How It Works</h2>
                  <div className="space-y-3">
                    {[
                      { step: "1", text: "Share your unique referral code with friends and family" },
                      { step: "2", text: "They place their first order using your code" },
                      { step: "3", text: "You both earn 100 Wheat Raja Points = ₹100!" },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
                        <p className="text-stone-600 text-sm leading-relaxed pt-1">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral history */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="font-semibold text-stone-900 mb-4">Referral History</h2>
                  <div className="space-y-3">
                    {[
                      { name: "Priya R.", date: "10 Jun 2024", status: "active", pts: 100 },
                      { name: "Mohan K.", date: "1 May 2024", status: "active", pts: 100 },
                      { name: "Sunita P.", date: "12 Apr 2024", status: "active", pts: 100 },
                      { name: "Anil G.", date: "20 Jun 2024", status: "pending", pts: 0 },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-sm shrink-0">{r.name[0]}</div>
                        <div className="flex-1"><p className="font-medium text-stone-900 text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.date}</p></div>
                        {r.status === "active"
                          ? <span className="text-green-700 font-bold text-sm">+{r.pts} pts</span>
                          : <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-full">Pending</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="font-serif text-2xl font-bold text-stone-900">My Addresses</h1>
                  <button className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                </div>
                <div className="space-y-4">
                  {ADDRESSES.map((a) => (
                    <div key={a.id} className={`bg-card border-2 rounded-2xl p-5 ${a.isDefault ? "border-amber-400" : "border-border"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">{a.label}</span>
                          {a.isDefault && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">Default</span>}
                        </div>
                        <button className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                      </div>
                      <p className="font-semibold text-stone-900 text-sm">{a.name}</p>
                      <p className="text-sm text-stone-600">{a.line}, {a.city} — {a.pin}</p>
                      <p className="text-xs text-muted-foreground mt-1">📱 {a.phone}</p>
                      {!a.isDefault && (
                        <button className="mt-3 text-xs text-amber-700 font-semibold hover:underline">Set as default</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEWS ── */}
            {tab === "reviews" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">My Reviews</h1>
                <div className="space-y-4">
                  {REVIEWS.slice(0, 2).map((r) => (
                    <div key={r.name} className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <StarRow rating={r.rating} />
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed mb-2">{r.text}</p>
                      <p className="text-xs text-amber-700 font-medium">Product: {r.product}</p>
                    </div>
                  ))}
                  <button className="w-full border-2 border-dashed border-border text-muted-foreground hover:border-amber-300 hover:text-amber-700 py-5 rounded-2xl transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Write a Review
                  </button>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Account Settings</h1>
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h2 className="font-semibold text-stone-900 mb-4">Profile</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                        <input defaultValue={displayName} className="w-full bg-stone-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                        <input defaultValue={user?.phone ?? "+91 98123 45670"} disabled className="w-full bg-stone-100 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">Email (Optional)</label>
                        <input placeholder="your@email.com" className="w-full bg-stone-50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors" />
                      </div>
                      <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm">Save Changes</button>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h2 className="font-semibold text-stone-900 mb-4">Notifications</h2>
                    <div className="space-y-3">
                      {["Order Updates via WhatsApp", "Delivery Alerts via SMS", "Offers &amp; Promotions", "Subscription Reminders"].map((item) => (
                        <div key={item} className="flex items-center justify-between py-1">
                          <span className="text-sm text-stone-700" dangerouslySetInnerHTML={{ __html: item }} />
                          <button className="w-11 h-6 bg-amber-500 rounded-full relative"><span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 hover:bg-red-50 py-3.5 rounded-xl transition-colors font-semibold text-sm">
                    <LogOut className="w-4 h-4" /> Sign Out of Account
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
