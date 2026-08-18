import { translate as t, localeTag, normalizeLocale, supportedLocales } from "@/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { blogPosts, getBlogPost } from "@/lib/blog";

export function generateStaticParams() {
  return blogPosts.flatMap((post) => supportedLocales.map((locale) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const lang = normalizeLocale(locale);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    title: post.title[lang],
    description: post.description[lang],
    alternates: {
      canonical: `${base}/${lang}/blog/${slug}`,
      languages: Object.fromEntries(supportedLocales.map((item) => [localeTag(item), `${base}/${item}/blog/${slug}`])),
    },
    openGraph: { type: "article", title: post.title[lang], description: post.description[lang], publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const lang = normalizeLocale(locale);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title[lang], description: post.description[lang], datePublished: post.publishedAt, dateModified: post.updatedAt, author: { "@type": "Organization", name: "Practicora" }, publisher: { "@type": "Organization", name: "Practicora" }, mainEntityOfPage: `${base}/${lang}/blog/${slug}` };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><MarketingHeader locale={locale}/><main><article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20"><p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{post.category[lang]}</p><h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">{post.title[lang]}</h1><p className="mt-5 text-lg leading-8 text-muted-strong">{post.description[lang]}</p><div className="mt-6 flex items-center gap-4 border-y border-border py-4 text-sm text-muted"><span>{new Intl.DateTimeFormat(localeTag(lang), { dateStyle: "long" }).format(new Date(post.updatedAt))}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4"/>{post.readingMinutes} {t(locale,"common.misc.minutes_short")}</span></div><div className="prose-stage mt-10">{post.sections[lang].map((section)=><section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}{section.bullets?<ul>{section.bullets.map((item)=><li key={item}>{item}</li>)}</ul>:null}</section>)}</div></article></main><MarketingFooter locale={locale}/></>;
}
