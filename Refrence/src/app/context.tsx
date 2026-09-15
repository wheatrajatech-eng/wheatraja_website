import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Page =
  | "home" | "shop" | "product" | "cart" | "checkout" | "success"
  | "tracking" | "login" | "dashboard" | "admin"
  | "about" | "blog" | "blog-detail" | "subscribe-page" | "contact" | "wishlist";

export interface CartItem {
  productId: number;
  qty: number;
}

interface AppUser {
  name: string;
  phone: string;
}

interface AppContextValue {
  page: Page;
  navigate: (p: Page, opts?: { productId?: number; blogId?: number }) => void;
  selectedProductId: number;
  selectedBlogId: number;
  cart: CartItem[];
  addToCart: (productId: number, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  cartCount: number;
  cartTotal: (prices: Record<number, number>) => number;
  clearCart: () => void;
  wishlist: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
  walletBalance: number;
  depositToWallet: (amount: number) => void;
  withdrawFromWallet: (amount: number) => boolean;
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  scrolled: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("home");
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [selectedBlogId, setSelectedBlogId] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [walletBalance, setWalletBalance] = useState(840);
  const [user, setUser] = useState<AppUser | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const navigate = useCallback((p: Page, opts?: { productId?: number; blogId?: number }) => {
    if (opts?.productId) setSelectedProductId(opts.productId);
    if (opts?.blogId) setSelectedBlogId(opts.blogId);
    setPage(p);
  }, []);

  const addToCart = useCallback((productId: number, qty = 1) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === productId);
      if (existing) return c.map((i) => i.productId === productId ? { ...i, qty: i.qty + qty } : i);
      return [...c, { productId, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) setCart((c) => c.filter((i) => i.productId !== productId));
    else setCart((c) => c.map((i) => i.productId === productId ? { ...i, qty } : i));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const cartTotal = useCallback(
    (prices: Record<number, number>) => cart.reduce((s, i) => s + (prices[i.productId] ?? 0) * i.qty, 0),
    [cart]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const addToWishlist = useCallback((productId: number) => {
    setWishlist((w) => w.includes(productId) ? w : [...w, productId]);
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setWishlist((w) => w.filter((id) => id !== productId));
  }, []);

  const isWishlisted = useCallback((productId: number) => wishlist.includes(productId), [wishlist]);

  const depositToWallet = useCallback((amount: number) => {
    setWalletBalance((b) => b + amount);
  }, []);

  const withdrawFromWallet = useCallback((amount: number): boolean => {
    if (amount > walletBalance) return false;
    setWalletBalance((b) => b - amount);
    return true;
  }, [walletBalance]);

  const login = useCallback((u: AppUser) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  return (
    <AppContext.Provider value={{
      page, navigate, selectedProductId, selectedBlogId,
      cart, addToCart, removeFromCart, updateQty, cartCount, cartTotal, clearCart,
      wishlist, addToWishlist, removeFromWishlist, isWishlisted,
      walletBalance, depositToWallet, withdrawFromWallet,
      user, login, logout, scrolled,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
