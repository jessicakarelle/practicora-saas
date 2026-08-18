"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { translate as t } from "@/i18n";
import { Brand } from "@/components/marketing/brand";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function MarketingHeader({ locale }: { locale: string }) {
  const [open,setOpen]=useState(false);
  const links=[
    [t(locale,"marketing.header.features"),`/${locale}/features`],
    [t(locale,"marketing.header.pricing"),`/${locale}/pricing`],
    [t(locale,"marketing.header.institutions"),`/${locale}/institutions`],
    [t(locale,"marketing.header.resources"),`/${locale}/resources`],
    [t(locale,"marketing.header.blog"),`/${locale}/blog`],
    [t(locale,"marketing.header.about"),`/${locale}/about`],
  ];
  return <header className="sticky top-0 z-50 border-b border-border/75 bg-background/92 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><Brand locale={locale}/><nav className="hidden items-center gap-0.5 lg:flex" aria-label={t(locale,"common.navigation.main_navigation")}>{links.map(([label,href])=><Link key={href} href={href} className="rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-strong transition-colors hover:bg-primary-softer hover:text-primary">{label}</Link>)}</nav><div className="flex items-center gap-2"><LanguageSwitcher locale={locale} compact/><ButtonLink href={`/${locale}/login`} variant="secondary" size="sm" className="hidden sm:inline-flex">{t(locale,"marketing.header.login")}</ButtonLink><ButtonLink href={`/${locale}/register`} size="sm" className="hidden sm:inline-flex"><span>{t(locale,"marketing.header.start")}</span><ArrowRight className="size-4"/></ButtonLink><button type="button" onClick={()=>setOpen(!open)} className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:border-primary/30 hover:bg-primary-softer hover:text-primary lg:hidden" aria-label={open?t(locale,"marketing.header.close_menu"):t(locale,"marketing.header.open_menu")}>{open?<X className="size-5"/>:<Menu className="size-5"/>}</button></div></div>{open?<div className="border-t border-border bg-surface px-4 py-4 shadow-[var(--shadow-float)] lg:hidden"><nav className="grid gap-1">{links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-bold text-muted-strong transition-colors hover:bg-primary-softer hover:text-primary">{label}</Link>)}</nav><div className="mt-3 grid grid-cols-2 gap-2"><ButtonLink href={`/${locale}/login`} variant="secondary" size="sm">{t(locale,"marketing.header.login")}</ButtonLink><ButtonLink href={`/${locale}/register`} size="sm">{t(locale,"marketing.header.start")}</ButtonLink></div></div>:null}</header>
}
