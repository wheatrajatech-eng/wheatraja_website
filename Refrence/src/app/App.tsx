import { motion, AnimatePresence } from "motion/react";
import { useApp, AppProvider } from "./context";
import { Nav } from "./Nav";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout, OrderSuccess } from "./pages/Checkout";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Admin } from "./pages/Admin";
import { Tracking } from "./pages/Tracking";
import { About } from "./pages/About";
import { Blog } from "./pages/Blog";
import { SubscribePage } from "./pages/SubscribePage";
import { Contact } from "./pages/Contact";
import { Wishlist } from "./pages/Wishlist";
import { Chatbot } from "./components/Chatbot";
import { PRODUCTS } from "./data";
import { ArrowRight, MessageCircle } from "lucide-react";

// Prices map for sticky cart
const PRICES = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price]));

// Nav is hidden on admin and auth pages
const NO_NAV_PAGES = ["admin", "login"];
// Sticky cart shown only on consumer pages
const CART_PAGES = ["home", "shop", "product"];

function PageContent() {
  const { page } = useApp();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {page === "home" && <Home />}
        {page === "shop" && <Shop />}
        {page === "product" && <ProductDetail />}
        {page === "cart" && <Cart />}
        {page === "checkout" && <Checkout />}
        {page === "success" && <OrderSuccess />}
        {page === "tracking" && <Tracking />}
        {page === "login" && <Auth />}
        {page === "dashboard" && <Dashboard />}
        {page === "admin" && <Admin />}
        {page === "about" && <About />}
        {page === "blog" && <Blog />}
        {page === "blog-detail" && <Blog />}
        {page === "subscribe-page" && <SubscribePage />}
        {page === "contact" && <Contact />}
        {page === "wishlist" && <Wishlist />}
      </motion.div>
    </AnimatePresence>
  );
}

function AppInner() {
  const { page, navigate, cartCount, cartTotal } = useApp();
  const showNav = !NO_NAV_PAGES.includes(page);
  const showCart = CART_PAGES.includes(page) && cartCount > 0;
  const total = cartTotal(PRICES);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {showNav && <Nav />}

      <PageContent />

      {/* Chatbot + WhatsApp — on all consumer pages */}
      {page !== "admin" && (
        <>
          <Chatbot />
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className={`fixed z-40 w-13 h-13 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-600/30 transition-all hover:scale-110 right-5 ${showCart ? "bottom-24" : "bottom-6"}`}
          >
            <MessageCircle className="w-6 h-6" />
          </a>
        </>
      )}

      {/* Sticky cart bar */}
      {showCart && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-stone-950/97 backdrop-blur-md border-t border-white/10 px-5 md:px-10 py-3.5 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {cartCount}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">
                {cartCount} item{cartCount !== 1 ? "s" : ""} in cart
              </div>
              <div className="text-white/45 text-xs">₹{total.toLocaleString("en-IN")} total</div>
            </div>
          </div>
          <button
            onClick={() => navigate("cart")}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm px-7 py-2.5 rounded-full transition-colors flex items-center gap-2"
          >
            View Cart <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
