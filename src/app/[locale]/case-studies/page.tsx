import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, BriefcaseBusiness } from "lucide-react";
import { translate as t } from "@/i18n";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { Card, CardContent } from "@/components/ui/card";

const icons = [GraduationCap, Building2, BriefcaseBusiness] as const;
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "marketing.resources.cases_metadata_title"), description: t(locale, "marketing.resources.cases_metadata_description") };
}
export default async function CaseStudiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MarketingPageShell locale={locale} eyebrow={t(locale,"marketing.resources.cases_eyebrow")} title={t(locale,"marketing.resources.cases_title")} description={t(locale,"marketing.resources.cases_description")}>
    <section className="mx-auto grid max-w-[1120px] gap-5 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
      {icons.map((Icon,index)=>{const key=`case_${index+1}`;return <Card key={key} className="transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"><CardContent className="flex h-full flex-col"><span className="flex size-11 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-5"/></span><p className="mt-5 text-xs font-bold uppercase tracking-[.12em] text-primary">{t(locale,`marketing.resources.${key}_eyebrow`)}</p><h2 className="mt-2 text-xl font-extrabold">{t(locale,`marketing.resources.${key}_title`)}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted">{t(locale,`marketing.resources.${key}_description`)}</p><Link href={`/${locale}/contact`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong">{t(locale,"marketing.resources.discuss_case")}<ArrowRight className="size-4"/></Link></CardContent></Card>})}
    </section>
  </MarketingPageShell>;
}
