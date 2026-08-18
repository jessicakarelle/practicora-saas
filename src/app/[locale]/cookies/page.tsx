import type { Metadata } from "next";
import { Cookie, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { translate as t } from "@/i18n";
import { CookieSettingsLink } from "@/components/privacy/cookie-settings-link";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { Card, CardContent } from "@/components/ui/card";
const rows=[Cookie,ShieldCheck,SlidersHorizontal] as const;
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;return{title:t(locale,"marketing.cookies.metadata_title"),description:t(locale,"marketing.cookies.metadata_description")}}
export default async function CookiesPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;const keys=["necessary","optional","control"] as const;return <MarketingPageShell locale={locale} eyebrow={t(locale,"marketing.cookies.eyebrow")} title={t(locale,"marketing.cookies.title")} description={t(locale,"marketing.cookies.description")}><section className="mx-auto max-w-[1050px] px-4 py-14 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-3">{rows.map((Icon,index)=>{const key=keys[index];return <Card key={key}><CardContent><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-4.5"/></span><h2 className="mt-5 text-lg font-extrabold">{t(locale,`marketing.cookies.${key}_title`)}</h2><p className="mt-2 text-sm leading-6 text-muted">{t(locale,`marketing.cookies.${key}_description`)}</p></CardContent></Card>})}</div><div className="mt-6 rounded-2xl border border-border bg-surface p-5"><CookieSettingsLink locale={locale}/></div></section></MarketingPageShell>}
