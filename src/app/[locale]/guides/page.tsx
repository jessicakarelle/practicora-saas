import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { translate as t } from "@/i18n";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "marketing.resources.guides_metadata_title"), description: t(locale, "marketing.resources.guides_metadata_description") };
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <MarketingPageShell locale={locale} eyebrow={t(locale, "marketing.resources.guides_eyebrow")} title={t(locale, "marketing.resources.guides_title")} description={t(locale, "marketing.resources.guides_description")}>
      <section className="mx-auto grid max-w-[1120px] gap-5 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => {
          const key = `guide_${index + 1}`;
          return (
            <Card id={`guide-${index + 1}`} key={key} className="scroll-mt-28 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
              <CardContent className="flex h-full flex-col">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><BookOpenCheck className="size-4.5" /></span>
                <h2 className="mt-5 text-lg font-extrabold">{t(locale, `marketing.resources.${key}_title`)}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted">{t(locale, `marketing.resources.${key}_description`)}</p>
                <Link href={`/${locale}/contact`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong">{t(locale, "marketing.faq.contact_us")}<ArrowRight className="size-4" /></Link>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </MarketingPageShell>
  );
}
