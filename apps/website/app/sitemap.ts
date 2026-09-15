import type { MetadataRoute } from "next";
import { blogPosts, products } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wheatraja.com";
  const staticRoutes = ["", "/products", "/about", "/contact", "/delivery", "/subscription", "/bulk-order", "/reviews", "/blog", "/shipping-policy", "/refund-policy", "/privacy-policy", "/terms", "/account/reminders"];
  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: new Date() })),
    ...blogPosts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.date) }))
  ];
}
