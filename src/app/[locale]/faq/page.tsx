import type { Metadata } from "next";
import { translate as t } from "@/i18n";
import { FaqExperience, type FaqItem } from "@/components/marketing/faq-experience";
import { MarketingPageShell } from "@/components/marketing/page-shell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "marketing.faq.metadata_title"), description: t(locale, "marketing.faq.metadata_description") };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items: FaqItem[] = Array.from({ length: 10 }, (_, index) => {
    const key = `q${index + 1}`;
    return {
      id: key,
      category: t(locale, `marketing.faq.${key}_category`),
      question: t(locale, `marketing.faq.${key}_question`),
      answer: t(locale, `marketing.faq.${key}_answer`),
    };
  });
  return (
    <MarketingPageShell locale={locale} eyebrow={t(locale, "marketing.faq.eyebrow")} title={t(locale, "marketing.faq.title")} description={t(locale, "marketing.faq.description")}>
      <FaqExperience locale={locale} items={items} />
    </MarketingPageShell>
  );
}
