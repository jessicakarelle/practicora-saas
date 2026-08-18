"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, MessageCircle } from "lucide-react";
import Link from "next/link";
import { translate as t } from "@/i18n";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

export type FaqItem = { id: string; category: string; question: string; answer: string };

export function FaqExperience({ locale, items }: { locale: string; items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    return items.filter((item) => (category === "all" || item.category === category) && (!normalized || `${item.question} ${item.answer}`.toLocaleLowerCase(locale).includes(normalized)));
  }, [category, items, locale, query]);

  return <div className="mx-auto max-w-[980px] px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:grid-cols-[1fr_240px]">
      <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, "marketing.faq.search_placeholder")} className="pl-10" /></div>
      <Select value={category} onValueChange={setCategory} options={[{ value: "all", label: t(locale, "marketing.faq.all_categories") }, ...categories.map((value) => ({ value, label: value }))]} />
    </div>
    <div className="mt-7 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      {filtered.map((item) => <details key={item.id} className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left font-extrabold transition-colors hover:bg-primary-softer focus-visible:bg-primary-softer sm:px-6"><span>{item.question}</span><ChevronDown className="size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180" /></summary>
        <div className="px-5 pb-6 text-sm leading-7 text-muted-strong sm:px-6">{item.answer}</div>
      </details>)}
      {!filtered.length ? <div className="px-6 py-12 text-center text-sm text-muted">{t(locale, "marketing.faq.no_results")}</div> : null}
    </div>
    <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary-softer p-6 sm:flex-row sm:items-center"><div><h2 className="font-extrabold">{t(locale, "marketing.faq.still_have_questions")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "marketing.faq.contact_description")}</p></div><Link href={`/${locale}/contact`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-strong"><MessageCircle className="size-4" />{t(locale, "marketing.faq.contact_us")}</Link></div>
  </div>;
}
