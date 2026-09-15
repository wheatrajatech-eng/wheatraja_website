import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, RefreshCw,
  Wallet, Gift, Tag, Star, Bell, BarChart3, Settings,
  LogOut, TrendingUp, TrendingDown, ArrowRight, Search,
  Filter, Eye, Check, X, Plus, Truck, Clock, ChevronDown,
  Download, AlertCircle,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useApp } from "../context";
import { ADMIN_ORDERS, ADMIN_CUSTOMERS, REVENUE_DATA, PRODUCT_MIX, PRODUCTS } from "../data";
import { StatusBadge } from "../shared";

type AdminTab = "dashboard" | "orders" | "products" | "customers" | "subscriptions" | "wallet" | "analytics" | "marketing" | "settings";

const SIDEBAR_ITEMS: { id: AdminTab; label: string; icon: any; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag, badge: "8" },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "marketing", label: "Marketing", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  out_for_delivery: "bg-blue-100 text-blue-700",
  packed: "bg-amber-100 text-amber-700",
  processing: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-600",
};

function KpiCard({ title, value, change, icon: Icon, up }: { title: string; value: string; change: string; icon: any; up: boolean }) {
  return (
    <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-white/8 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <span className={`text-xs font-bold flex items-center gap-1 ${up ? "text-green-400" : "text-red-400"}`}>
          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {change}
        </span>
      </div>
      <p className="font-bold text-white text-2xl mb-0.5">{value}</p>
      <p className="text-white/45 text-xs">{title}</p>
    </div>
  );
}

export function Admin() {
  const { navigate } = useApp();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [walletEnabled, setWalletEnabled] = useState(true);
  const [cashbackEnabled, setCashbackEnabled] = useState(true);
  const [referralEnabled, setReferralEnabled] = useState(true);

  const filteredOrders = ADMIN_ORDERS.filter((o) =>
    o.id.includes(orderSearch) || o.customer.toLowerCase().includes(orderSearch.toLowerCase())
  );
  const filteredCustomers = ADMIN_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  return (
    <div className="min-h-screen bg-[#13131F] flex pt-0">
      {/* Admin sidebar */}
      <aside className="w-60 shrink-0 bg-[#0F0F1A] border-r border-white/8 min-h-screen sticky top-0 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-xs">WR</span></div>
            <div>
              <p className="font-bold text-white text-sm">Wheat Raja</p>
              <p className="text-white/40 text-[10px]">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-amber-600/20 text-amber-400 border border-amber-500/20" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${tab === id ? "text-amber-400" : "text-white/30"}`} />
              <span className="flex-1 text-left">{label}</span>
              {badge && <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
          <button onClick={() => navigate("home")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white/80 transition-all">
            <ArrowRight className="w-4 h-4 shrink-0 text-white/30" /> View Website
          </button>
          <button onClick={() => navigate("home")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4 shrink-0" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-[#0F0F1A] border-b border-white/8 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold capitalize text-lg">{tab === "dashboard" ? "Overview" : tab}</h1>
            <p className="text-white/40 text-xs">Wheat Raja Admin · {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 bg-white/8 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/12 transition-colors">
              <Bell className="w-4 h-4 text-white/60" />
            </button>
            <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center font-bold text-white text-sm">A</div>
          </div>
        </div>

        <div className="p-8">
          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <div>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCard title="Revenue (Jun)" value="₹97,000" change="+15.5%" icon={TrendingUp} up={true} />
                <KpiCard title="Orders (Jun)" value="388" change="+8.2%" icon={ShoppingBag} up={true} />
                <KpiCard title="Active Customers" value="1,240" change="+4.1%" icon={Users} up={true} />
                <KpiCard title="Subscriptions" value="234" change="+12.3%" icon={RefreshCw} up={true} />
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Revenue chart */}
                <div className="md:col-span-2 bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white">Revenue & Orders</h2>
                    <span className="text-white/40 text-xs">Last 6 months</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="revenue" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="orders" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1E1E2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                      <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#B8780C" strokeWidth={2.5} dot={false} name="Revenue (₹)" />
                      <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#3A6644" strokeWidth={2.5} dot={false} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Product mix */}
                <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                  <h2 className="font-semibold text-white mb-5">Product Mix</h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={PRODUCT_MIX} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {PRODUCT_MIX.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1E1E2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: 12 }} formatter={(v) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {PRODUCT_MIX.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-white/60">{p.name}</span></div>
                        <span className="text-white font-bold">{p.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-white">Recent Orders</h2>
                  <button onClick={() => setTab("orders")} className="text-amber-400 text-xs font-bold hover:underline flex items-center gap-1">View All <ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/8">
                        <th className="text-left pb-3 font-semibold">Order ID</th>
                        <th className="text-left pb-3 font-semibold">Customer</th>
                        <th className="text-left pb-3 font-semibold">Product</th>
                        <th className="text-left pb-3 font-semibold">Total</th>
                        <th className="text-left pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ADMIN_ORDERS.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-white/3 transition-colors">
                          <td className="py-3 text-amber-400 font-mono text-xs">#{o.id.slice(-6)}</td>
                          <td className="py-3"><p className="text-white font-medium text-sm">{o.customer}</p><p className="text-white/40 text-xs">{o.area}</p></td>
                          <td className="py-3 text-white/60 text-xs">{o.product}</td>
                          <td className="py-3 text-white font-bold">₹{o.total}</td>
                          <td className="py-3"><StatusBadge status={o.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === "orders" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="Search orders…" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
                <button className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>

              <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/8">
                        <th className="text-left px-5 py-4 font-semibold">Order</th>
                        <th className="text-left px-5 py-4 font-semibold">Customer</th>
                        <th className="text-left px-5 py-4 font-semibold">Product</th>
                        <th className="text-left px-5 py-4 font-semibold">Area</th>
                        <th className="text-left px-5 py-4 font-semibold">Total</th>
                        <th className="text-left px-5 py-4 font-semibold">Date</th>
                        <th className="text-left px-5 py-4 font-semibold">Status</th>
                        <th className="text-left px-5 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-5 py-4 text-amber-400 font-mono text-xs">#{o.id.slice(-6)}</td>
                          <td className="px-5 py-4"><p className="text-white font-medium">{o.customer}</p><p className="text-white/40 text-xs">{o.phone}</p></td>
                          <td className="px-5 py-4 text-white/70 text-xs">{o.product}</td>
                          <td className="px-5 py-4 text-white/60 text-xs">{o.area}</td>
                          <td className="px-5 py-4 text-white font-bold">₹{o.total}</td>
                          <td className="px-5 py-4 text-white/60 text-xs">{o.date}</td>
                          <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button className="w-7 h-7 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors"><Eye className="w-3.5 h-3.5 text-white/60" /></button>
                              {o.status === "processing" && <button className="w-7 h-7 bg-amber-600/20 hover:bg-amber-600/30 rounded-lg flex items-center justify-center transition-colors"><Check className="w-3.5 h-3.5 text-amber-400" /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {tab === "products" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-bold">All Products</h2>
                <button className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Add Product</button>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {PRODUCTS.map((p) => (
                  <div key={p.id} className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                    <div className="aspect-square rounded-xl overflow-hidden bg-stone-800 mb-4">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <h3 className="font-bold text-white mb-1">{p.name}</h3>
                    <p className="text-white/40 text-xs mb-3">{p.sku}</p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-xl p-3"><p className="text-white font-bold">₹{p.price}</p><p className="text-white/40 text-[10px]">MRP</p></div>
                      <div className="bg-white/5 rounded-xl p-3"><p className="text-white font-bold">₹{p.subPrice}</p><p className="text-white/40 text-[10px]">Sub Price</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-white/8 hover:bg-white/15 text-white/70 text-xs font-semibold py-2 rounded-xl transition-colors">Edit</button>
                      <button className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold py-2 rounded-xl transition-colors">Inventory</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === "customers" && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="Search customers…" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              </div>

              <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/8">
                        <th className="text-left px-5 py-4 font-semibold">Customer</th>
                        <th className="text-left px-5 py-4 font-semibold">Orders</th>
                        <th className="text-left px-5 py-4 font-semibold">Total Spend</th>
                        <th className="text-left px-5 py-4 font-semibold">Wallet</th>
                        <th className="text-left px-5 py-4 font-semibold">Joined</th>
                        <th className="text-left px-5 py-4 font-semibold">Area</th>
                        <th className="text-left px-5 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-white/3 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-amber-600/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-xs">{c.name[0]}</div>
                              <div><p className="text-white font-medium">{c.name}</p><p className="text-white/40 text-xs">{c.phone}</p></div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-white font-bold">{c.orders}</td>
                          <td className="px-5 py-4 text-white">₹{c.totalSpend.toLocaleString("en-IN")}</td>
                          <td className="px-5 py-4 text-amber-400 font-semibold">₹{c.wallet}</td>
                          <td className="px-5 py-4 text-white/60 text-xs">{c.joined}</td>
                          <td className="px-5 py-4 text-white/60 text-xs">{c.area}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.status === "active" ? "bg-green-500/20 text-green-400" : "bg-stone-500/20 text-stone-400"}`}>{c.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab === "analytics" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly revenue */}
                <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                  <h2 className="font-semibold text-white mb-5">Monthly Revenue</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "#1E1E2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`]} />
                      <Bar dataKey="revenue" fill="#B8780C" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Orders trend */}
                <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                  <h2 className="font-semibold text-white mb-5">Orders Trend</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={REVENUE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1E1E2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                      <Line type="monotone" dataKey="orders" stroke="#3A6644" strokeWidth={2.5} dot={{ fill: "#3A6644", r: 4 }} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stat summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Avg Order Value", val: "₹250", sub: "+₹12 vs last month" },
                  { label: "Subscription Rate", val: "38%", sub: "Of all customers" },
                  { label: "Wallet Usage", val: "22%", sub: "Orders using wallet" },
                  { label: "Referral Rate", val: "14%", sub: "New customer source" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                    <p className="font-bold text-white text-2xl">{s.val}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                    <p className="text-green-400 text-[10px] mt-2">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WALLET (ADMIN) ── */}
          {tab === "wallet" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { label: "Total Wallet Balance", val: "₹48,200", icon: Wallet },
                  { label: "Points Issued (Jun)", val: "4,820 pts", icon: TrendingUp },
                  { label: "Points Redeemed (Jun)", val: "1,200 pts", icon: TrendingDown },
                ].map((s) => (
                  <div key={s.label} className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                    <s.icon className="w-6 h-6 text-amber-400 mb-3" />
                    <p className="font-bold text-white text-2xl">{s.val}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-6">Wallet Controls</h2>
                <div className="space-y-5">
                  {[
                    { label: "Wallet Feature", desc: "Enable or disable the wallet system for all users", state: walletEnabled, setter: setWalletEnabled },
                    { label: "Cashback (2%)", desc: "Automatically credit 2% cashback on every order", state: cashbackEnabled, setter: setCashbackEnabled },
                    { label: "Referral Rewards", desc: "Award 100 points for each successful referral", state: referralEnabled, setter: setReferralEnabled },
                  ].map(({ label, desc, state, setter }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-white/8 last:border-0">
                      <div>
                        <p className="font-semibold text-white text-sm">{label}</p>
                        <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setter(!state)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${state ? "bg-amber-500" : "bg-white/15"}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${state ? "translate-x-7" : "translate-x-1"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MARKETING ── */}
          {tab === "marketing" && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { title: "WhatsApp Broadcast", desc: "Send bulk WhatsApp messages to customers", icon: "💬", count: "1,240 contacts" },
                  { title: "SMS Campaign", desc: "Send promotional SMS to selected segments", icon: "📱", count: "1,240 numbers" },
                  { title: "Push Notifications", desc: "Send push notifications to app users", icon: "🔔", count: "892 devices" },
                  { title: "Coupon Generator", desc: "Create and manage discount coupons", icon: "🏷️", count: "12 active" },
                ].map((m) => (
                  <div key={m.title} className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{m.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{m.title}</h3>
                        <p className="text-white/45 text-xs mb-3">{m.desc}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-400 font-semibold">{m.count}</span>
                          <button className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-full transition-colors">Launch</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active coupons */}
              <div className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-white">Active Coupons</h2>
                  <button className="text-xs font-bold text-amber-400 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> New Coupon</button>
                </div>
                <div className="space-y-3">
                  {[
                    { code: "FIRST20", type: "20% off", usage: "142 / 500", expiry: "30 Jun 2024", active: true },
                    { code: "SAVE05", type: "5% off", usage: "89 / ∞", expiry: "Never", active: true },
                    { code: "FREE1KG", type: "Free 1 kg", usage: "23 / 100", expiry: "31 Jul 2024", active: true },
                    { code: "FLAT50", type: "₹50 flat", usage: "500 / 500", expiry: "15 Jun 2024", active: false },
                  ].map((c) => (
                    <div key={c.code} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="font-mono font-bold text-amber-400 text-sm w-20">{c.code}</span>
                      <span className="text-white/60 text-xs">{c.type}</span>
                      <span className="text-white/40 text-xs flex-1">Used: {c.usage}</span>
                      <span className="text-white/40 text-xs">Exp: {c.expiry}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{c.active ? "Active" : "Expired"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <div className="space-y-5 max-w-2xl">
              {[
                {
                  title: "Delivery Configuration",
                  items: [
                    { label: "Free Delivery Radius", val: "20 km", type: "input" },
                    { label: "Zone 1 (20-30 km) Charge", val: "₹29", type: "input" },
                    { label: "Zone 2 (30-50 km) Charge", val: "₹49", type: "input" },
                    { label: "Min Order for Free Delivery", val: "₹499", type: "input" },
                  ],
                },
                {
                  title: "Discount Settings",
                  items: [
                    { label: "First Order Discount", val: "20%", type: "input" },
                    { label: "Subscription Discount", val: "10%", type: "input" },
                    { label: "Wallet Cashback Rate", val: "2%", type: "input" },
                    { label: "Referral Reward Points", val: "100", type: "input" },
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="bg-[#1E1E2E] border border-white/8 rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-5">{section.title}</h2>
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-center gap-4">
                        <label className="text-white/60 text-sm flex-1">{item.label}</label>
                        <input defaultValue={item.val} className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-amber-500/50 transition-colors" />
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm">Save Changes</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
