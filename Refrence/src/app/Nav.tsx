import { useState } from "react";
import { ShoppingCart, Menu, X, User, ArrowRight, Heart } from "lucide-react";
import { useApp } from "./context";

type NavLink = { label: string; page: Parameters<ReturnType<typeof useApp>["navigate"]>[0] };

const DESKTOP_LINKS: NavLink[] = [
  { label: "Shop", page: "shop" },
  { label: "Subscribe", page: "subscribe-page" },
  { label: "Blog", page: "blog" },
  { label: "About", page: "about" },
  { label: "Contact", page: "contact" },
];

const MOBILE_LINKS: NavLink[] = [
  { label: "Home", page: "home" },
  { label: "Shop", page: "shop" },
  { label: "Subscribe", page: "subscribe-page" },
  { label: "Blog", page: "blog" },
  { label: "About", page: "about" },
  { label: "Contact", page: "contact" },
  { label: "My Wishlist", page: "wishlist" },
  { label: "Dashboard", page: "dashboard" },
];

export function Nav() {
  const { scrolled, cartCount, navigate, page, user, wishlist } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = page === "home";
  const transparent = isHome && !scrolled;

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-white/96 backdrop-blur-md shadow-sm border-b border-stone-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-10 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => navigate("home")} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">WR</span>
          </div>
          <span className={`font-serif font-bold text-xl tracking-tight ${transparent ? "text-white" : "text-stone-900"}`}>
            Wheat Raja
          </span>
        </button>

        {/* Desktop links */}
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${transparent ? "text-white/85" : "text-stone-600"}`}>
          {DESKTOP_LINKS.map(({ label, page: pg }) => (
            <button
              key={label}
              onClick={() => navigate(pg)}
              className={`hover:opacity-100 transition-opacity ${page === pg ? "opacity-100 font-semibold" : "opacity-75"}`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => navigate("admin")} className="hover:opacity-100 opacity-75 transition-opacity text-purple-500 font-semibold">Admin ↗</button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Wishlist */}
          <button
            onClick={() => navigate("wishlist")}
            className={`relative p-2 rounded-full transition-colors ${transparent ? "hover:bg-white/15" : "hover:bg-stone-100"}`}
          >
            <Heart className={`w-5 h-5 ${transparent ? "text-white" : "text-stone-700"}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {wishlist.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("cart")}
            className={`relative p-2 rounded-full transition-colors ${transparent ? "hover:bg-white/15" : "hover:bg-stone-100"}`}
          >
            <ShoppingCart className={`w-5 h-5 ${transparent ? "text-white" : "text-stone-700"}`} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate(user ? "dashboard" : "login")}
            className={`p-2 rounded-full transition-colors ${transparent ? "hover:bg-white/15" : "hover:bg-stone-100"}`}
          >
            <User className={`w-5 h-5 ${transparent ? "text-white" : "text-stone-700"}`} />
          </button>

          <button
            onClick={() => navigate("shop")}
            className="hidden md:inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors ml-1"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded-full transition-colors ${transparent ? "hover:bg-white/15" : "hover:bg-stone-100"}`}
          >
            {menuOpen
              ? <X className={`w-5 h-5 ${transparent ? "text-white" : "text-stone-800"}`} />
              : <Menu className={`w-5 h-5 ${transparent ? "text-white" : "text-stone-800"}`} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 px-5 py-5 space-y-3 shadow-lg">
          {MOBILE_LINKS.map(({ label, page: pg }) => (
            <button
              key={label}
              onClick={() => { navigate(pg); setMenuOpen(false); }}
              className={`block w-full text-left font-medium py-1.5 ${page === pg ? "text-amber-700 font-semibold" : "text-stone-700"}`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { navigate("admin"); setMenuOpen(false); }}
            className="block w-full text-left text-purple-600 font-semibold py-1.5"
          >
            Admin Panel ↗
          </button>
          <button
            onClick={() => { navigate("shop"); setMenuOpen(false); }}
            className="block w-full bg-amber-600 text-white text-center font-semibold py-3 rounded-full mt-3"
          >
            Shop Now
          </button>
        </div>
      )}
    </nav>
  );
}
