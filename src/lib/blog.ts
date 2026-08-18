import type { Locale } from "@/lib/types";
import frPosts from "@/i18n/locales/fr/content/blog-posts.json";
import enPosts from "@/i18n/locales/en/content/blog-posts.json";
import esPosts from "@/i18n/locales/es/content/blog-posts.json";
import ptPosts from "@/i18n/locales/pt/content/blog-posts.json";
import dePosts from "@/i18n/locales/de/content/blog-posts.json";
import itPosts from "@/i18n/locales/it/content/blog-posts.json";
import arPosts from "@/i18n/locales/ar/content/blog-posts.json";

export type BlogSection = { heading: string; paragraphs: string[]; bullets?: string[] };
export type LocalizedBlogPost = { slug: string; publishedAt: string; updatedAt: string; readingMinutes: number; title: string; description: string; category: string; sections: BlogSection[] };
export type BlogPost = { slug: string; publishedAt: string; updatedAt: string; readingMinutes: number; title: Record<Locale,string>; description: Record<Locale,string>; category: Record<Locale,string>; sections: Record<Locale,BlogSection[]> };

const localePosts: Record<Locale, LocalizedBlogPost[]> = { fr: frPosts, en: enPosts, es: esPosts, pt: ptPosts, de: dePosts, it: itPosts, ar: arPosts };
const byLocale = Object.fromEntries(Object.entries(localePosts).map(([locale, posts]) => [locale, new Map(posts.map((post) => [post.slug, post]))])) as Record<Locale, Map<string, LocalizedBlogPost>>;
const slugs = Array.from(new Set(Object.values(localePosts).flatMap((posts) => posts.map((post) => post.slug))));

function localizedRecord<T>(slug: string, selector: (post: LocalizedBlogPost) => T): Record<Locale, T> {
  const english = byLocale.en.get(slug) || byLocale.fr.get(slug);
  if (!english) throw new Error(`Missing base blog post: ${slug}`);
  return Object.fromEntries((Object.keys(localePosts) as Locale[]).map((locale) => [locale, selector(byLocale[locale].get(slug) || english)])) as Record<Locale, T>;
}

export const blogPosts: BlogPost[] = slugs.map((slug) => {
  const base = byLocale.en.get(slug) || byLocale.fr.get(slug)!;
  return {
    slug,
    publishedAt: base.publishedAt,
    updatedAt: base.updatedAt,
    readingMinutes: base.readingMinutes,
    title: localizedRecord(slug, (post) => post.title),
    description: localizedRecord(slug, (post) => post.description),
    category: localizedRecord(slug, (post) => post.category),
    sections: localizedRecord(slug, (post) => post.sections),
  };
});

export function getBlogPost(slug: string) { return blogPosts.find((post) => post.slug === slug); }
export function getLocalizedBlogPost(slug: string, locale: Locale): LocalizedBlogPost | undefined { return byLocale[locale].get(slug) || byLocale.en.get(slug) || byLocale.fr.get(slug); }
