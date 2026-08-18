import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";

const locales = ["fr", "en", "es", "pt", "de", "it", "ar"] as const;
const pages = [
  "",
  "/features",
  "/pricing",
  "/institutions",
  "/about",
  "/contact",
  "/resources",
  "/guides",
  "/case-studies",
  "/blog",
  "/faq",
  "/changelog",
  "/security",
  "/accessibility",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  return [
    ...locales.flatMap((locale) =>
      pages.map((page) => ({
        url: `${base}/${locale}${page}`,
        lastModified: now,
        changeFrequency:
          page === "/blog" || page === "/resources"
            ? ("weekly" as const)
            : ("monthly" as const),
        priority:
          page === ""
            ? 1
            : page === "/features" || page === "/pricing"
              ? 0.85
              : page === "/resources" || page === "/guides" || page === "/faq"
                ? 0.75
                : 0.62,
      })),
    ),
    ...locales.flatMap((locale) =>
      blogPosts.map((post) => ({
        url: `${base}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.72,
      })),
    ),
  ];
}
