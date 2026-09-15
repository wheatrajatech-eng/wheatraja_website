// ── Types ─────────────────────────────────────────────────────────────────────
export type Page =
  | "home"
  | "shop"
  | "product"
  | "cart"
  | "checkout"
  | "success"
  | "tracking"
  | "login"
  | "dashboard"
  | "admin";

export interface Product {
  id: number;
  name: string;
  tagline: string;
  description: string;
  benefits: string[];
  image: string;
  images: string[];
  price: number;
  subPrice: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  category: string;
  weight: string;
  protein: string;
  fiber: string;
  sku: string;
}

export interface CartItem {
  productId: number;
  qty: number;
}

export interface Order {
  id: string;
  date: string;
  status: "delivered" | "out_for_delivery" | "packed" | "processing" | "cancelled";
  items: { name: string; qty: number; price: number }[];
  total: number;
  address: string;
  paymentMethod: string;
}

export interface Subscription {
  id: string;
  product: string;
  frequency: "weekly" | "biweekly" | "monthly";
  nextDelivery: string;
  price: number;
  status: "active" | "paused" | "cancelled";
  startDate: string;
}

export interface WalletTx {
  id: string;
  date: string;
  description: string;
  points: number;
  type: "credit" | "debit";
  orderId?: string;
}

export interface AdminOrder {
  id: string;
  customer: string;
  phone: string;
  product: string;
  qty: number;
  total: number;
  status: "delivered" | "out_for_delivery" | "packed" | "processing" | "cancelled";
  date: string;
  area: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  orders: number;
  totalSpend: number;
  wallet: number;
  joined: string;
  status: "active" | "inactive";
  area: string;
}

// ── Images ────────────────────────────────────────────────────────────────────
export const IMGS = {
  hero: "https://images.unsplash.com/photo-1529511582893-2d7e684dd128?w=1920&h=1080&fit=crop&auto=format",
  flour: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop&auto=format",
  wheat: "https://images.unsplash.com/photo-1564493031643-4be2c4347a17?w=600&h=600&fit=crop&auto=format",
  bread: "https://images.unsplash.com/photo-1613396874083-2d5fbe59ae79?w=600&h=600&fit=crop&auto=format",
  mill: "https://images.unsplash.com/photo-1763809677023-4f3450645dee?w=600&h=600&fit=crop&auto=format",
  stone: "https://images.unsplash.com/photo-1781450951170-72a1b92cd3ed?w=600&h=600&fit=crop&auto=format",
  roti: "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?w=600&h=600&fit=crop&auto=format",
};

// ── Products ──────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Multigrain Atta",
    tagline: "7-grain blend for optimal nutrition",
    description:
      "Our Multigrain Atta is a masterful blend of 7 carefully selected grains — wheat, jowar, bajra, ragi, oats, maize, and barley. Every bag is freshly stone-ground after your order, preserving maximum nutrition. Rich in fibre, protein, and essential minerals, it makes soft, golden rotis that your family will love.",
    benefits: ["High Fiber", "Protein Rich", "Diabetic Friendly"],
    image: IMGS.flour,
    images: [IMGS.flour, IMGS.wheat, IMGS.stone],
    price: 299,
    subPrice: 269,
    rating: 4.8,
    reviewCount: 2840,
    badge: "Best Seller",
    category: "Multigrain",
    weight: "5 kg",
    protein: "12g / 100g",
    fiber: "8g / 100g",
    sku: "WR-MGA-5KG",
  },
  {
    id: 2,
    name: "MP Sharbati Atta",
    tagline: "Premium wheat from Madhya Pradesh",
    description:
      "Sourced exclusively from the fertile plains of Madhya Pradesh, MP Sharbati wheat is renowned for its natural sweetness and superior gluten strength. Stone-ground fresh after your order, it delivers rotis that are visibly softer, naturally fragrant, and golden-hued — the hallmark of true Chakki Fresh atta.",
    benefits: ["Soft Rotis", "Natural Sweetness", "Chakki Fresh"],
    image: IMGS.wheat,
    images: [IMGS.wheat, IMGS.flour, IMGS.roti],
    price: 249,
    subPrice: 224,
    rating: 4.9,
    reviewCount: 4210,
    badge: "Most Popular",
    category: "Sharbati",
    weight: "5 kg",
    protein: "10g / 100g",
    fiber: "6g / 100g",
    sku: "WR-SHB-5KG",
  },
  {
    id: 3,
    name: "Sehori Atta",
    tagline: "Heritage variety, stone ground",
    description:
      "Sehori is one of India's oldest and most revered wheat varieties, cultivated in the Sehore district of MP for centuries. Its larger grain size and higher mineral content make it unique among premium attas. Milled on traditional stone chakki after your order, it brings heritage and nutrition together in every roti.",
    benefits: ["Traditional Milling", "Rich in Minerals", "Pure & Natural"],
    image: IMGS.bread,
    images: [IMGS.bread, IMGS.mill, IMGS.stone],
    price: 279,
    subPrice: 251,
    rating: 4.7,
    reviewCount: 1560,
    badge: "Heritage Pick",
    category: "Heritage",
    weight: "5 kg",
    protein: "11g / 100g",
    fiber: "7g / 100g",
    sku: "WR-SEH-5KG",
  },
];

// ── Mock Orders ───────────────────────────────────────────────────────────────
export const ORDERS: Order[] = [
  {
    id: "WR2024001234",
    date: "22 Jun 2024",
    status: "delivered",
    items: [{ name: "MP Sharbati Atta 5 kg", qty: 2, price: 498 }],
    total: 498,
    address: "45-B, Sector 45, Noida - 201301",
    paymentMethod: "UPI",
  },
  {
    id: "WR2024001198",
    date: "8 Jun 2024",
    status: "delivered",
    items: [
      { name: "Multigrain Atta 5 kg", qty: 1, price: 299 },
      { name: "MP Sharbati Atta 5 kg", qty: 1, price: 249 },
    ],
    total: 548,
    address: "45-B, Sector 45, Noida - 201301",
    paymentMethod: "Wallet + UPI",
  },
  {
    id: "WR2024001100",
    date: "24 May 2024",
    status: "delivered",
    items: [{ name: "Sehori Atta 5 kg", qty: 2, price: 558 }],
    total: 558,
    address: "45-B, Sector 45, Noida - 201301",
    paymentMethod: "Credit Card",
  },
];

export const CURRENT_ORDER = {
  id: "WR2024001301",
  product: "MP Sharbati Atta 5 kg",
  qty: 1,
  total: 249,
  placedAt: "10:30 AM, 24 Jun 2024",
  expectedDelivery: "25 Jun 2024",
  status: "out_for_delivery" as const,
  steps: [
    { label: "Order Received", time: "10:30 AM, 24 Jun", done: true },
    { label: "Milling Started", time: "2:00 PM, 24 Jun", done: true },
    { label: "Order Packed", time: "6:00 PM, 24 Jun", done: true },
    { label: "Out for Delivery", time: "8:15 AM, 25 Jun", done: true },
    { label: "Delivered", time: "Expected by 1 PM", done: false },
  ],
  delivery: { name: "Ramu", phone: "+91 98001 23456", vehicle: "DL-1CA-5678" },
};

// ── Mock Subscriptions ────────────────────────────────────────────────────────
export const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "SUB001",
    product: "MP Sharbati Atta — 5 kg",
    frequency: "monthly",
    nextDelivery: "15 Jul 2024",
    price: 224,
    status: "active",
    startDate: "15 Apr 2024",
  },
  {
    id: "SUB002",
    product: "Multigrain Atta — 5 kg",
    frequency: "biweekly",
    nextDelivery: "28 Jun 2024",
    price: 269,
    status: "active",
    startDate: "1 May 2024",
  },
];

// ── Wallet Data ───────────────────────────────────────────────────────────────
export const WALLET_BALANCE = 840;
export const WALLET_TXS: WalletTx[] = [
  { id: "TXN001", date: "22 Jun 2024", description: "Cashback — Order #WR2024001234", points: 10, type: "credit", orderId: "WR2024001234" },
  { id: "TXN002", date: "10 Jun 2024", description: "Referral Reward — Priya R. joined", points: 100, type: "credit" },
  { id: "TXN003", date: "8 Jun 2024", description: "Redeemed — Order #WR2024001198", points: -100, type: "debit", orderId: "WR2024001198" },
  { id: "TXN004", date: "8 Jun 2024", description: "Cashback — Order #WR2024001198", points: 11, type: "credit", orderId: "WR2024001198" },
  { id: "TXN005", date: "24 May 2024", description: "Cashback — Order #WR2024001100", points: 11, type: "credit", orderId: "WR2024001100" },
  { id: "TXN006", date: "1 May 2024", description: "Referral Reward — Mohan K. joined", points: 100, type: "credit" },
  { id: "TXN007", date: "15 Apr 2024", description: "Welcome Bonus", points: 50, type: "credit" },
  { id: "TXN008", date: "12 Apr 2024", description: "Referral Reward — Sunita P. joined", points: 100, type: "credit" },
];

// ── Admin Data ────────────────────────────────────────────────────────────────
export const ADMIN_ORDERS: AdminOrder[] = [
  { id: "WR2024001301", customer: "Rohit Sharma", phone: "9812345670", product: "MP Sharbati 5 kg", qty: 1, total: 249, status: "out_for_delivery", date: "24 Jun 2024", area: "Sector 45, Noida" },
  { id: "WR2024001300", customer: "Anita Mehta", phone: "9876543211", product: "Multigrain 5 kg", qty: 2, total: 598, status: "packed", date: "24 Jun 2024", area: "Vaishali" },
  { id: "WR2024001299", customer: "Vikram Singh", phone: "9898765432", product: "Sehori 5 kg", qty: 1, total: 279, status: "processing", date: "24 Jun 2024", area: "Greater Noida" },
  { id: "WR2024001298", customer: "Priya Sharma", phone: "9001234567", product: "MP Sharbati 5 kg", qty: 2, total: 498, status: "delivered", date: "23 Jun 2024", area: "Sector 45, Noida" },
  { id: "WR2024001297", customer: "Deepak Gupta", phone: "9811234560", product: "Multigrain 5 kg", qty: 1, total: 299, status: "delivered", date: "23 Jun 2024", area: "Indirapuram" },
  { id: "WR2024001296", customer: "Sunita Patel", phone: "9765432109", product: "Sehori 5 kg", qty: 3, total: 837, status: "delivered", date: "22 Jun 2024", area: "Gurugram" },
  { id: "WR2024001295", customer: "Rajesh Kumar", phone: "9654321098", product: "MP Sharbati 5 kg", qty: 1, total: 249, status: "cancelled", date: "22 Jun 2024", area: "Indirapuram" },
  { id: "WR2024001294", customer: "Meena Joshi", phone: "9543210987", product: "Multigrain 5 kg", qty: 2, total: 598, status: "delivered", date: "21 Jun 2024", area: "Delhi NCR" },
];

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  { id: "CUS001", name: "Priya Sharma", phone: "9001234567", orders: 12, totalSpend: 3840, wallet: 280, joined: "Jan 2024", status: "active", area: "Sector 45, Noida" },
  { id: "CUS002", name: "Rohit Sharma", phone: "9812345670", orders: 8, totalSpend: 2240, wallet: 840, joined: "Feb 2024", status: "active", area: "Sector 45, Noida" },
  { id: "CUS003", name: "Anita Mehta", phone: "9876543211", orders: 6, totalSpend: 1680, wallet: 120, joined: "Mar 2024", status: "active", area: "Vaishali" },
  { id: "CUS004", name: "Vikram Singh", phone: "9898765432", orders: 4, totalSpend: 1116, wallet: 0, joined: "Apr 2024", status: "active", area: "Greater Noida" },
  { id: "CUS005", name: "Deepak Gupta", phone: "9811234560", orders: 9, totalSpend: 2691, wallet: 540, joined: "Jan 2024", status: "active", area: "Indirapuram" },
  { id: "CUS006", name: "Sunita Patel", phone: "9765432109", orders: 3, totalSpend: 837, wallet: 0, joined: "May 2024", status: "inactive", area: "Gurugram" },
  { id: "CUS007", name: "Rajesh Kumar", phone: "9654321098", orders: 7, totalSpend: 1743, wallet: 340, joined: "Feb 2024", status: "active", area: "Indirapuram" },
  { id: "CUS008", name: "Meena Joshi", phone: "9543210987", orders: 11, totalSpend: 3279, wallet: 660, joined: "Jan 2024", status: "active", area: "Delhi NCR" },
];

export const REVENUE_DATA = [
  { month: "Jan", revenue: 48000, orders: 192 },
  { month: "Feb", revenue: 62000, orders: 248 },
  { month: "Mar", revenue: 71000, orders: 284 },
  { month: "Apr", revenue: 58000, orders: 232 },
  { month: "May", revenue: 84000, orders: 336 },
  { month: "Jun", revenue: 97000, orders: 388 },
];

export const PRODUCT_MIX = [
  { name: "MP Sharbati", value: 42, color: "#B8780C" },
  { name: "Multigrain", value: 35, color: "#3A6644" },
  { name: "Sehori", value: 23, color: "#6B5A3E" },
];

// ── Reviews ───────────────────────────────────────────────────────────────────
export const REVIEWS = [
  { name: "Priya Sharma", location: "Sector 45, Noida", rating: 5, text: "The rotis are absolutely amazing. My family noticed the difference from day one — you can actually taste the freshness. We switched completely.", initials: "PS", date: "22 Jun 2024", product: "MP Sharbati Atta" },
  { name: "Rajesh Kumar", location: "Indirapuram, Ghaziabad", rating: 5, text: "Finally found atta my diabetic father can eat without worry. The multigrain variety is a game changer for health-conscious households.", initials: "RK", date: "15 Jun 2024", product: "Multigrain Atta" },
  { name: "Anita Mehta", location: "Vaishali", rating: 5, text: "I was skeptical at first but after trying Wheat Raja I subscribed for monthly delivery. The difference from supermarket atta is night and day.", initials: "AM", date: "8 Jun 2024", product: "MP Sharbati Atta" },
  { name: "Vikram Singh", location: "Greater Noida", rating: 4, text: "Quality is premium and delivery is fast. The freshly milled difference is real — lighter, tastier rotis every single time.", initials: "VS", date: "1 Jun 2024", product: "Sehori Atta" },
];

// ── FAQs ──────────────────────────────────────────────────────────────────────
export const FAQS = [
  { q: "What makes Wheat Raja atta different?", a: "Every bag is freshly milled after you place your order. We don't pre-grind and store — maximum nutrition, unbeatable freshness in every roti." },
  { q: "How soon do I receive my order after milling?", a: "We mill within 24–48 hours and dispatch immediately. Delivery takes 1–3 working days depending on your NCR location." },
  { q: "What is NABL certification?", a: "NABL (National Accreditation Board for Testing and Calibration Laboratories) certification means our wheat undergoes rigorous third-party testing for purity, nutrition, and absence of adulterants." },
  { q: "How does the subscription plan work?", a: "Choose your product, quantity, and frequency. We auto-process and deliver on schedule. Save 10%, get priority delivery, and cancel anytime." },
  { q: "Which areas do you deliver to?", a: "We deliver across NCR — Noida, Greater Noida, Ghaziabad, Delhi, Gurugram, and Faridabad. Free delivery within 20 km of Sector 78 fulfillment center." },
  { q: "What is the Wheat Raja Wallet?", a: "Every purchase earns 2% cashback as Points (1 point = ₹1). Redeem from 100 points on any order." },
  { q: "Is there a money-back guarantee?", a: "Yes. If you're not 100% satisfied with your first order, we'll refund it fully — no questions asked." },
  { q: "Can I save multiple delivery addresses?", a: "Yes. Your account supports unlimited saved addresses. Subscriptions can each have a different delivery address." },
];

// Blog posts
export interface BlogPost {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  image: string;
  tags: string[];
  content: string;
}

export const BLOG_CATEGORIES = ["All", "Healthy Eating", "Atta Knowledge", "Recipes", "Nutrition", "Lifestyle"];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Why Freshly Milled Atta is Better for Your Health",
    category: "Healthy Eating",
    date: "20 Jun 2024",
    author: "Dr. Ananya Sharma",
    readTime: "5 min read",
    excerpt: "Commercial atta loses up to 40% of its nutrients during storage. Discover the science-backed reasons why freshly milled flour delivers superior nutrition in every roti.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=500&fit=crop&auto=format",
    tags: ["nutrition", "health", "fresh milling", "atta"],
    content: "When wheat is milled and the resulting flour is stored for months, it undergoes oxidation that destroys key vitamins — particularly vitamin E and B-complex vitamins. Studies show that packaged atta stored for more than 30 days loses up to 40% of its thiamine (B1) and riboflavin (B2) content. Freshly milled atta, ground immediately before packaging, retains the full bran, germ, and endosperm — delivering the complete nutrition profile the wheat plant intended. The essential oils in wheat germ are particularly vulnerable to oxidation. These oils contain vitamin E, a powerful antioxidant, and essential fatty acids. Once exposed to air, they degrade within weeks. Commercial mills that produce large batches for warehouse distribution cannot preserve these nutrients. Wheat Raja mills your atta only after your order is placed, ensuring zero nutrient loss from storage. The result: softer rotis, better aroma, and superior nutritional value that your body can actually absorb and use."
  },
  {
    id: 2,
    title: "The Ancient Art of Stone Grinding: Our Process Explained",
    category: "Atta Knowledge",
    date: "15 Jun 2024",
    author: "Suresh Verma",
    readTime: "4 min read",
    excerpt: "Stone chakki grinding has been used for thousands of years. Modern high-speed steel mills generate heat that destroys nutrients. Here's why we still use the old way.",
    image: "https://images.unsplash.com/photo-1763809677023-4f3450645dee?w=800&h=500&fit=crop&auto=format",
    tags: ["stone grinding", "chakki", "milling process", "traditional"],
    content: "Traditional stone grinding (chakki) operates at low RPM, generating minimal heat during the milling process. This is critical because wheat's delicate nutrients — enzymes, vitamins, and beneficial bacteria — are sensitive to heat above 40°C. Modern roller mills and hammer mills used by commercial flour producers operate at speeds that generate temperatures exceeding 80°C, effectively pasteurizing the flour and destroying its living nutrition. Our granite stone chakkis rotate at carefully calibrated speeds, maintaining flour temperature below 35°C throughout the grinding process. This preserves the wheat germ's oils, the bran's fibre, and the endosperm's protein structure. The resulting flour has a slightly coarser, more natural texture that creates rotis with better structure and more satisfying bite. Stone-ground flour also has a lower glycemic index than roller-milled equivalents — meaning your blood sugar rises more slowly and steadily after eating, making it genuinely healthier for daily consumption."
  },
  {
    id: 3,
    title: "5 Multigrain Roti Recipes Your Family Will Love",
    category: "Recipes",
    date: "10 Jun 2024",
    author: "Chef Priya Nair",
    readTime: "7 min read",
    excerpt: "Transform your daily roti into a nutritional powerhouse. These five recipes use Wheat Raja Multigrain Atta to create delicious, healthy rotis that even picky eaters will enjoy.",
    image: "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?w=800&h=500&fit=crop&auto=format",
    tags: ["recipes", "multigrain", "roti", "healthy cooking"],
    content: "Recipe 1 — Classic Multigrain Roti: Mix 2 cups Wheat Raja Multigrain Atta with 1 tsp salt, 1 tsp ghee, and warm water to form a soft dough. Rest for 20 minutes, roll thin, and cook on a hot tawa for 2-3 minutes each side. The result is a golden, slightly nutty roti packed with 7-grain nutrition. Recipe 2 — Methi Multigrain Paratha: Add 1 cup fresh fenugreek leaves, 1 tsp cumin, and 1 tsp carom seeds to the multigrain dough. Stuff with a spiced potato filling and cook with a drizzle of ghee. Recipe 3 — Palak Multigrain Roti: Blend 1 cup spinach and mix into the dough. The spinach adds iron and folate while creating beautiful green rotis that children adore. Recipe 4 — Garlic Multigrain Roti: Add 4 minced garlic cloves and 2 tbsp coriander leaves to the dough. Garlic's allicin compounds enhance the atta's own nutritional profile. Recipe 5 — High-Protein Dahi Roti: Replace water with hung curd when kneading. The lactic acid in curd activates the wheat's gluten for an exceptionally soft texture with added calcium and probiotics."
  },
  {
    id: 4,
    title: "Diabetes and Atta: Why Multigrain is the Smart Choice",
    category: "Healthy Eating",
    date: "5 Jun 2024",
    author: "Dr. Vikram Patel",
    readTime: "6 min read",
    excerpt: "For the 77 million Indians living with diabetes, the right atta choice can meaningfully impact blood sugar management. Here's the evidence-based guide to choosing your flour.",
    image: "https://images.unsplash.com/photo-1564493031643-4be2c4347a17?w=800&h=500&fit=crop&auto=format",
    tags: ["diabetes", "multigrain", "blood sugar", "nutrition science"],
    content: "The glycemic index (GI) of your daily roti matters far more than most people realize. Standard refined wheat flour (maida) has a GI of 70-75, while whole wheat atta sits at 50-55. But freshly milled multigrain atta? Our blend of wheat, jowar, bajra, ragi, oats, maize, and barley achieves a GI of just 38-42 — comparable to vegetables. This dramatic difference is explained by three factors: (1) the high fiber content slows glucose absorption, (2) the diverse grain proteins create a physical matrix that slows starch digestion, and (3) beta-glucan from oats and barley actively lowers post-meal blood sugar response. A 2023 clinical study at AIIMS found that participants who replaced their regular atta with freshly milled multigrain atta for 12 weeks showed significant reductions in HbA1c levels and fasting blood glucose. Participants also reported feeling fuller for longer — a key benefit for weight management, which is strongly linked to diabetes control. We recommend consulting your diabetes care team before making dietary changes, but for many of our customers, switching to Wheat Raja Multigrain Atta has been an important part of their health journey."
  },
  {
    id: 5,
    title: "How to Identify Pure, Adulterant-Free Atta at Home",
    category: "Atta Knowledge",
    date: "28 May 2024",
    author: "Wheat Raja Quality Team",
    readTime: "4 min read",
    excerpt: "Atta adulteration is more common than you think. From chalk powder to synthetic gluten, here are the simple home tests that reveal what's really in your flour.",
    image: "https://images.unsplash.com/photo-1613396874083-2d5fbe59ae79?w=800&h=500&fit=crop&auto=format",
    tags: ["food safety", "adulteration", "quality testing", "consumer guide"],
    content: "Test 1 — The Water Dissolution Test: Mix 1 tsp of atta with water. Pure atta will form a dough. If chalk or talc powder has been added, you'll see white particles separating and settling. Test 2 — The Smell Test: Fresh, pure atta smells like wheat — slightly sweet, earthy, and clean. Adulterated atta may smell musty, chemical, or have no aroma whatsoever. Test 3 — The Burn Test: Burn a small amount of atta. Pure wheat flour burns cleanly with a grain-like smell. Added synthetic materials will produce acrid smoke. Test 4 — The Iodine Test for Starch: Drop iodine solution on atta paste. A deep blue-black indicates pure wheat starch. Unusually bright blue suggests added starch adulterants. Test 5 — The HCl Test for Chalk: Add a few drops of hydrochloric acid to atta. Pure atta shows minimal reaction. Chalk-adulterated flour will produce visible bubbling (CO2 release). Wheat Raja atta undergoes NABL-certified laboratory testing for all common adulterants before each batch is milled. Our test results are available on request — we believe every customer has the right to know exactly what they're eating."
  },
  {
    id: 6,
    title: "The Gut Health Connection: How Fresh Flour Feeds Your Microbiome",
    category: "Nutrition",
    date: "20 May 2024",
    author: "Dr. Ananya Sharma",
    readTime: "5 min read",
    excerpt: "Your gut bacteria thrive on diverse fibers found in whole, fresh grains. Commercial atta's loss of bran and germ depletes the prebiotic food your microbiome depends on.",
    image: "https://images.unsplash.com/photo-1529511582893-2d7e684dd128?w=800&h=500&fit=crop&auto=format",
    tags: ["gut health", "microbiome", "prebiotics", "fiber", "nutrition"],
    content: "Your gut microbiome consists of approximately 100 trillion bacteria that influence everything from digestion to immunity to mental health. These bacteria are highly dependent on fermentable fibers — specifically the types found in whole grain wheat bran. When wheat is processed into commercial atta, the bran (which contains most of the fermentable fiber) is often partially removed or damaged. Freshly milled whole wheat retains arabinoxylan, beta-glucan, and fructooligosaccharides — three classes of prebiotic fiber that selectively feed beneficial gut bacteria including Bifidobacterium and Lactobacillus species. Our Multigrain Atta delivers an even broader spectrum of prebiotic fibers from its 7-grain blend. Each grain feeds slightly different bacterial species, promoting the microbial diversity that researchers increasingly associate with robust health outcomes. Customers who switch to Wheat Raja regularly report improvements in digestion, reduced bloating, and more consistent energy levels — all consistent with a healthier, more diverse gut microbiome."
  }
];
