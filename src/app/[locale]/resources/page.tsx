import type { Metadata } from "next";
import { translate as t } from "@/i18n";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { ResourceExplorer, type ResourceItem } from "@/components/marketing/resource-explorer";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "marketing.resources.metadata_title"), description: t(locale, "marketing.resources.metadata_description") };
}

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items: ResourceItem[] = Array.from({ length: 12 }, (_, index) => {
    const key = `item_${index + 1}`;
    return {
      id: key,
      type: t(locale, `marketing.resources.${key}_type`),
      level: t(locale, `marketing.resources.${key}_level`),
      title: t(locale, `marketing.resources.${key}_title`),
      description: t(locale, `marketing.resources.${key}_description`),
      href: index < 9 ? `/${locale}/guides#guide-${index + 1}` : `/${locale}/contact`,
    };
  });
  return (
    <MarketingPageShell locale={locale} eyebrow={t(locale, "marketing.resources.eyebrow")} title={t(locale, "marketing.resources.title")} description={t(locale, "marketing.resources.description")}>
      <ResourceExplorer locale={locale} items={items} />
    </MarketingPageShell>
  );
}
