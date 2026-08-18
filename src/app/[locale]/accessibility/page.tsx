import type { Metadata } from "next";
import { Keyboard, LayoutPanelTop, Activity, RefreshCw } from "lucide-react";
import { translate as t } from "@/i18n";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { Card, CardContent } from "@/components/ui/card";
const icons=[Keyboard,LayoutPanelTop,Activity,RefreshCw] as const;
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;return{title:t(locale,"marketing.accessibility.metadata_title"),description:t(locale,"marketing.accessibility.metadata_description")}}
export default async function AccessibilityPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;return <MarketingPageShell locale={locale} eyebrow={t(locale,"marketing.accessibility.eyebrow")} title={t(locale,"marketing.accessibility.title")} description={t(locale,"marketing.accessibility.description")}><section className="mx-auto grid max-w-[1120px] gap-5 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8">{icons.map((Icon,index)=><Card key={index}><CardContent><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-4.5"/></span><h2 className="mt-5 text-lg font-extrabold">{t(locale,`marketing.accessibility.section_${index+1}_title`)}</h2><p className="mt-2 text-sm leading-6 text-muted">{t(locale,`marketing.accessibility.section_${index+1}_description`)}</p></CardContent></Card>)}</section></MarketingPageShell>}
