export type Product = {
  slug: string;
  name: string;
  subtitle: string;
  headline: string;
  benefit: string;
  price1: number;
  price5: number;
  price10: number;
  image: string;
  gallery: string[];
  ingredients: string;
  nutrition: { label: string; value: string }[];
  proof: string[];
  bestFor: string[];
  comparison: { label: string; wheatRaja: string; packaged: string }[];
  storage: string[];
  accent: string;
  notes: string[];
  faqs: { q: string; a: string }[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Blog" | "News" | "Article" | string;
  readTime: string;
  hero: string;
  content: string[];
  body?: string;
  author?: string;
  tags?: string[];
  gallery?: string[];
  inlineImages?: string[];
  featured?: boolean;
  pinnedRank?: number;
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string;
};

export const products: Product[] = [
  {
    slug: "mp-sharbati-atta",
    name: "MP Sharbati Atta",
    subtitle: "Naturally sweet, soft rotis from selected Madhya Pradesh wheat.",
    headline: "MP Sharbati Atta - For Naturally Soft Rotis",
    benefit: "Freshly milled from premium MP wheat for soft, light, everyday rotis.",
    price1: 78,
    price5: 390,
    price10: 690,
    image: "/assets/products/sharbati_atta_5kg.png",
    gallery: [
      "/assets/products/sharbati_atta_1kg.png",
      "/assets/products/sharbati_atta_5kg.png",
      "/assets/products/sharbati_atta_10kg.png"
    ],
    ingredients: "100% selected MP Sharbati wheat, stone-ground after order.",
    nutrition: [
      { label: "Protein", value: "11g approx / 100g" },
      { label: "Fiber", value: "10g approx / 100g" },
      { label: "Additives", value: "None" }
    ],
    proof: ["FSSAI approved", "NABL certified quality promise", "Batch-milled after order", "Packed within 6 hours of milling"],
    bestFor: ["Everyday rotis", "Lunchbox phulkas", "Families who prefer naturally soft texture"],
    comparison: [
      { label: "Milling", wheatRaja: "After your order", packaged: "Often milled and stored earlier" },
      { label: "Freshness", wheatRaja: "Batch date visible", packaged: "Shelf-life first" },
      { label: "Additives", wheatRaja: "No maida, no preservatives", packaged: "Varies by brand" }
    ],
    storage: ["Keep in an airtight container", "Use within 30 days for best aroma", "Store away from heat and moisture"],
    accent: "#D9A441",
    notes: ["Stone-ground after your order", "Ideal for soft daily rotis", "No maida, no preservatives"],
    faqs: [
      { q: "When is it milled?", a: "Every batch is milled after the order is received." },
      { q: "How should I store it?", a: "Keep sealed in a cool dry place and use within 30 days." }
    ]
  },
  {
    slug: "super-multigrain-atta",
    name: "Super Multigrain Atta",
    subtitle: "Wheat, millets and pulses blended for a fuller everyday atta.",
    headline: "Super Multigrain Atta - More Grains, More Goodness",
    benefit: "A balanced blend of grains for families who want taste, fibre, and nutrition together.",
    price1: 94,
    price5: 470,
    price10: 880,
    image: "/assets/products/multigrain_atta_5kg.png",
    gallery: [
      "/assets/products/multigrain_atta_1kg.png",
      "/assets/products/multigrain_atta_5kg.png",
      "/assets/products/multigrain_atta_10kg.png"
    ],
    ingredients: "Wheat, Jowar, Bajra, Ragi, Soya, Chana, Jau, Makka, Alsi, Methi.",
    nutrition: [
      { label: "Protein", value: "13g approx / 100g" },
      { label: "Fiber", value: "12g approx / 100g" },
      { label: "Free gift", value: "1 KG above Rs. 999" }
    ],
    proof: ["FSSAI approved", "NABL certified quality promise", "Small-batch blended", "No artificial improvers"],
    bestFor: ["Nutrition-focused families", "Hearty daily rotis", "Monthly subscription plans"],
    comparison: [
      { label: "Blend", wheatRaja: "Small-batch grain balance", packaged: "Mass standardized blend" },
      { label: "Reward", wheatRaja: "Free 1 KG above Rs. 999", packaged: "Marketplace dependent" },
      { label: "Subscription", wheatRaja: "Fresh monthly delivery", packaged: "Reorder manually" }
    ],
    storage: ["Refrigerate in humid weather", "Use a dry spoon", "Seal immediately after use"],
    accent: "#4D7A39",
    notes: ["High-fiber family blend", "Free 1 KG on orders above Rs. 999", "Balanced taste and nutrition"],
    faqs: [
      { q: "Is it good for daily rotis?", a: "Yes, the blend is designed to stay soft while adding nutrition." },
      { q: "Can I subscribe?", a: "Yes, monthly subscriptions get 10% off." }
    ]
  },
  {
    slug: "sehori-sharbati-atta",
    name: "Sehori Sharbati Atta",
    subtitle: "Premium Sehori wheat with a soft bite and gentle aroma.",
    headline: "Sehori Sharbati Atta - Rich Taste, Premium Freshness",
    benefit: "A premium wheat choice for families who want traditional taste and freshness.",
    price1: 95,
    price5: 475,
    price10: 890,
    image: "/assets/products/sehori_atta_5kg.png",
    gallery: [
      "/assets/products/sehori_atta_1kg.png",
      "/assets/products/sehori_atta_5kg.png",
      "/assets/products/sehori_atta_10kg.png"
    ],
    ingredients: "Premium Sehori Sharbati wheat, stone-ground fresh for aromatic rotis.",
    nutrition: [
      { label: "Protein", value: "11.5g approx / 100g" },
      { label: "Texture", value: "Fine chakki grind" },
      { label: "Additives", value: "None" }
    ],
    proof: ["FSSAI approved", "NABL certified quality promise", "Premium Sehori wheat", "Milled only after checkout"],
    bestFor: ["Premium home meals", "Soft rotis with aroma", "Families upgrading from regular atta"],
    comparison: [
      { label: "Wheat", wheatRaja: "Premium Sehori Sharbati", packaged: "Broad commodity sourcing" },
      { label: "Texture", wheatRaja: "Fresh chakki feel", packaged: "Factory grind consistency" },
      { label: "Transparency", wheatRaja: "Batch proof ready", packaged: "Limited milling visibility" }
    ],
    storage: ["Transfer after opening", "Keep sealed and dry", "Use early for best aroma"],
    accent: "#B56E3B",
    notes: ["Premium Sehori grain", "Fresh chakki texture", "Naturally aromatic"],
    faqs: [
      { q: "What makes Sehori different?", a: "It is prized for softness, aroma and a naturally rich roti feel." },
      { q: "Is delivery free?", a: "Delivery is free within 20 KM of Sector 78, Noida." }
    ]
  }
];

export const deliveryRules = [
  { range: "0-20 KM", charge: "Free" },
  { range: "20-30 KM", charge: "Rs. 40" },
  { range: "30-40 KM", charge: "Rs. 70" },
  { range: "40-60 KM", charge: "Rs. 100" },
  { range: "60 KM+", charge: "Not deliverable unless approved" }
];

export const reviews = [
  { name: "Ritika, Sector 78", text: "The rotis stayed soft till dinner. It actually smells freshly milled.", rating: 5, product: "MP Sharbati Atta", verified: true },
  { name: "Amit, Indirapuram", text: "Clean packaging, quick delivery and a very premium feel.", rating: 5, product: "Sehori Sharbati Atta", verified: true },
  { name: "Neha, Noida Extension", text: "Subscription is convenient. The Sharbati atta has become our regular.", rating: 5, product: "Super Multigrain Atta", verified: true }
];

export const blogPosts: BlogPost[] = [
  {
    slug: "fresh-milled-atta-vs-stored-atta",
    title: "Fresh Milled Atta vs Stored Atta",
    excerpt: "Why milling after order changes aroma, softness and trust.",
    date: "2026-06-01",
    category: "Blog",
    readTime: "4 min read",
    hero: "/assets/products/sharbati_atta_5kg.png",
    content: [
      "Fresh atta starts with a shorter journey between grain, chakki, pack and kitchen. When flour sits for long periods, the aroma softens and the everyday roti experience can feel flatter.",
      "WheatRaja is built around a local fresh-milling promise. The order is confirmed first, then the grain is milled, packed and moved through the delivery route with a clearer freshness story.",
      "For families, the difference is practical: better aroma when the pack opens, a more familiar chakki texture, and confidence that the atta was not simply waiting on a shelf for months."
    ]
  },
  {
    slug: "stone-ground-wheat-guide",
    title: "A Simple Guide to Stone-Ground Wheat",
    excerpt: "The old chakki method, redesigned for modern homes.",
    date: "2026-06-12",
    category: "Article",
    readTime: "5 min read",
    hero: "/assets/banners/cover7.png",
    content: [
      "Stone grinding is valued because it keeps the flour close to the texture Indian kitchens associate with chakki atta. It is not just a nostalgic word; it affects how the dough feels in hand.",
      "A good stone-ground atta should be balanced. It should not feel lifeless or overly processed, and it should work for everyday rotis without asking the cook to change the whole routine.",
      "WheatRaja combines that traditional milling idea with modern ordering, subscriptions and local delivery, so the freshness is convenient rather than complicated."
    ]
  },
  {
    slug: "how-to-keep-rotis-soft",
    title: "How to Keep Rotis Soft",
    excerpt: "Small kitchen habits and better flour make a visible difference.",
    date: "2026-06-18",
    category: "Blog",
    readTime: "3 min read",
    hero: "/assets/products/sehori_atta_5kg.png",
    content: [
      "Soft rotis begin before the tawa. Use fresh atta, add water slowly, and let the dough rest long enough for the flour to hydrate evenly.",
      "Avoid making the dough too tight. A slightly softer dough usually rolls better and keeps rotis tender after cooking.",
      "Freshly milled wheat can improve aroma and texture, but cooking habits still matter: medium-high heat, quick puffing and covered storage help rotis stay soft."
    ]
  },
  {
    slug: "wheat-benefits-for-indian-homes",
    title: "Wheat Benefits for Indian Homes",
    excerpt: "A clear look at why wheat remains a daily staple for balanced home meals.",
    date: "2026-06-22",
    category: "Article",
    readTime: "4 min read",
    hero: "/assets/products/multigrain_atta_5kg.png",
    content: [
      "Wheat remains central to Indian homes because it is familiar, versatile and easy to pair with vegetables, dals, curd and everyday sabzis.",
      "Whole wheat atta contributes carbohydrates for energy, some protein and fibre, and a satisfying base for daily meals. The exact nutrition depends on grain quality, milling and blend.",
      "For families looking for more variety, multigrain atta can add millets, pulses and seeds while keeping the roti format everyone already understands."
    ]
  },
  {
    slug: "fresh-atta-delivery-noida-update",
    title: "Fresh Atta Delivery Expands Across Noida",
    excerpt: "WheatRaja continues improving local delivery for Noida apartments and nearby zones.",
    date: "2026-06-25",
    category: "News",
    readTime: "2 min read",
    hero: "/assets/delivery/mahagunmoderne.png",
    content: [
      "WheatRaja is strengthening delivery coverage from Sector 78, Noida, with a focus on apartment societies and repeat monthly homes.",
      "The delivery model keeps the freshness promise practical: mill after order, pack cleanly, then route the order through the service zone as quickly as possible.",
      "Customers can use the delivery checker before checkout to confirm serviceability, charges and estimated delivery windows."
    ]
  },
  {
    slug: "multigrain-atta-family-nutrition",
    title: "Why Families Choose Multigrain Atta",
    excerpt: "More grains, more texture and a practical way to add variety to daily rotis.",
    date: "2026-06-27",
    category: "Blog",
    readTime: "4 min read",
    hero: "/assets/products/multigrain_atta_10kg.png",
    content: [
      "Multigrain atta is popular because it adds variety without changing the everyday food format. Families still make rotis, but the flour blend carries more grains and texture.",
      "WheatRaja Super Multigrain includes wheat, jowar, bajra, ragi, soya, chana, jau, makka, alsi and methi. The goal is balance: taste, fibre and nutrition together.",
      "For regular use, start with familiar recipes and adjust water gradually. Multigrain dough can hydrate differently from regular wheat atta."
    ]
  }
];

export const adminModules = [
  "Dashboard", "Orders", "Products", "Inventory", "Coupons", "Banners",
  "Subscriptions", "Blogs / Recipes", "Customer Queries", "Reviews Approval",
  "Customers", "Delivery Rules", "Analytics", "Settings"
];

export const trustProofs = [
  { title: "FSSAI Approved", text: "Food safety badge shown clearly across the store for buyer confidence." },
  { title: "NABL Certified", text: "Quality promise presented with the uploaded certification badge." },
  { title: "Milled-Date Promise", text: "Every order gets a batch code, milled date and packed date." },
  { title: "Freshness Guarantee", text: "Replacement support for damaged or stale packs within the policy window." }
];
