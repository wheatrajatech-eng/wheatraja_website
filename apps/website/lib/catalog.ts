import { apiGet } from "@/lib/api";
import { BlogPost, Product, blogPosts as fallbackBlogs, products as fallbackProducts } from "@/lib/data";

type ApiProduct = {
  slug: string;
  name: string;
  description: string;
  headline?: string | null;
  benefit?: string | null;
  ingredients?: string | null;
  accent?: string | null;
  nutrition?: Array<{ label: string; value: string }>;
  proof?: string[];
  best_for?: string[];
  comparison?: Array<{ label: string; wheatRaja: string; packaged: string }>;
  storage?: string[];
  notes?: string[];
  faqs?: Array<{ q: string; a: string }>;
  active: boolean;
  variants: Array<{ weight_kg: number; price: number; inventory: number }>;
  images?: Array<{ url: string; alt: string }>;
};

type ApiBlog = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category?: "Blog" | "News" | "Article";
  read_time?: string;
  cover_image_url?: string;
  published: boolean;
  created_at?: string;
  author_name?: string | null;
  tags?: string[];
  gallery?: string[];
  inline_images?: string[];
  featured?: boolean;
  pinned_rank?: number;
  status?: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
  content_format?: string;
  meta_keywords?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type CatalogBanner = {
  id: number;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  cta_text?: string | null;
  link_url?: string | null;
  display_order?: number;
};

function variantPrice(product: ApiProduct, weight: number, fallback: number) {
  return product.variants.find((variant) => variant.weight_kg === weight)?.price ?? fallback;
}

function mapProduct(product: ApiProduct): Product {
  const fallback = fallbackProducts.find((item) => item.slug === product.slug);
  const images = product.images?.map((image) => image.url).filter(Boolean);
  const defaultImage = images?.[0] ?? "/assets/products/sharbati_atta_5kg.png";
  return {
    ...(fallback ?? {
      headline: product.name,
      ingredients: product.description,
      nutrition: [],
      proof: [],
      bestFor: [],
      comparison: [],
      storage: [],
      accent: "#D9A441",
      notes: [],
      faqs: []
    }),
    slug: product.slug,
    name: product.name,
    subtitle: product.description || fallback?.subtitle || product.name,
    headline: product.headline || fallback?.headline || product.name,
    benefit: product.benefit || product.description || fallback?.benefit || product.name,
    price1: variantPrice(product, 1, fallback?.price1 ?? 0),
    price5: variantPrice(product, 5, fallback?.price5 ?? 0),
    price10: variantPrice(product, 10, fallback?.price10 ?? 0),
    image: images?.[1] ?? images?.[0] ?? fallback?.image ?? defaultImage,
    gallery: images?.length ? images : fallback?.gallery ?? [defaultImage],
    ingredients: product.ingredients || fallback?.ingredients || product.description,
    nutrition: product.nutrition?.length ? product.nutrition : fallback?.nutrition ?? [],
    proof: product.proof?.length ? product.proof : fallback?.proof ?? [],
    bestFor: product.best_for?.length ? product.best_for : fallback?.bestFor ?? [],
    comparison: product.comparison?.length ? product.comparison : fallback?.comparison ?? [],
    storage: product.storage?.length ? product.storage : fallback?.storage ?? [],
    accent: product.accent || fallback?.accent || "#D9A441",
    notes: product.notes?.length ? product.notes : fallback?.notes ?? [],
    faqs: product.faqs?.length ? product.faqs : fallback?.faqs ?? []
  };
}

export async function getCatalogProducts() {
  try {
    const rows = await apiGet<ApiProduct[]>("/products");
    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getCatalogProduct(slug: string) {
  try {
    return mapProduct(await apiGet<ApiProduct>(`/products/${slug}`));
  } catch {
    return undefined;
  }
}

function mapBlog(post: ApiBlog): BlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.published_at?.slice(0, 10) ?? post.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    category: post.category ?? "Blog",
    readTime: post.read_time ?? "4 min read",
    hero: post.cover_image_url ?? "/assets/banners/cover7.png",
    content: post.body.split(/\n{2,}/).filter(Boolean),
    body: post.body,
    author: post.author_name ?? "WheatRaja Team",
    tags: post.tags ?? [],
    gallery: post.gallery ?? [],
    inlineImages: post.inline_images ?? [],
    featured: Boolean(post.featured),
    pinnedRank: post.pinned_rank ?? 100,
    seoTitle: post.seo_title ?? post.title,
    seoDescription: post.seo_description ?? post.excerpt,
    metaKeywords: post.meta_keywords ?? ""
  };
}

export async function getCatalogBlogs() {
  try {
    const rows = await apiGet<ApiBlog[]>("/blogs");
    return rows.map(mapBlog);
  } catch {
    return [];
  }
}

export async function getCatalogBlog(slug: string) {
  try {
    return mapBlog(await apiGet<ApiBlog>(`/blogs/${slug}`));
  } catch {
    return undefined;
  }
}

export async function getCatalogBanners() {
  try {
    return await apiGet<CatalogBanner[]>("/banners");
  } catch {
    return [];
  }
}

export async function getBlogProducts(slug: string) {
  try {
    const rows = await apiGet<ApiProduct[]>(`/growth/blogs/${slug}/products`);
    return rows.map(mapProduct);
  } catch {
    return [];
  }
}
