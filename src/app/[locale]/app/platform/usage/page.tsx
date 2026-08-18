"use client";

import { use, useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, Gauge, UserRound } from "lucide-react";
import { localeTag, translate as t } from "@/i18n";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformUsage, type PlatformUsage } from "@/lib/platform";

export default function PlatformUsagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [rows, setRows] = useState<PlatformUsage[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; void listPlatformUsage().then((data) => { if (!cancelled) { setRows(data); setLoading(false); } }); return () => { cancelled = true; }; }, []);
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows]);
  const subjects = useMemo(() => new Set(rows.map((row) => `${row.subjectType}:${row.subjectId}`)).size, [rows]);
  const features = useMemo(() => new Set(rows.map((row) => row.featureKey)).size, [rows]);
  const date = (value: string) => new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(value));
  return <PlatformRequired locale={locale} permission="platform.usage.view"><PageHeader title={t(locale, "platform.usage.title")} description={t(locale, "platform.usage.description")} /><div className="grid gap-4 sm:grid-cols-3"><MetricCard icon={Gauge} label={t(locale, "platform.usage.quantity")} value={loading ? "—" : String(total)} meta={t(locale, "platform.usage.updated")} /><MetricCard icon={UserRound} label={t(locale, "platform.usage.subject")} value={loading ? "—" : String(subjects)} meta={t(locale, "platform.usage.period")} tone="info" /><MetricCard icon={BarChart3} label={t(locale, "platform.usage.feature")} value={loading ? "—" : String(features)} meta={t(locale, "platform.usage.description")} tone="success" /></div><div className="mt-5 space-y-3">{loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />) : rows.length ? rows.map((row, index) => <Card key={`${row.subjectId}-${row.featureKey}-${index}`}><CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_220px] md:items-center"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">{row.subjectType === "organization" ? <Building2 className="size-4" /> : <UserRound className="size-4" />}</span><div className="min-w-0"><div className="truncate font-extrabold">{row.subjectName}</div><div className="text-xs text-muted">{t(locale, `platform.usage.${row.subjectType}`)}</div></div></div><div><div className="text-xs font-bold text-muted">{t(locale, "platform.usage.feature")}</div><code className="mt-1 block truncate text-sm text-foreground">{row.featureKey}</code></div><div><div className="text-xs font-bold text-muted">{t(locale, "platform.usage.quantity")}</div><div className="mt-1 text-lg font-extrabold tabular-nums">{row.quantity}</div></div><div className="text-sm text-muted-strong">{t(locale, "platform.usage.from_to", { start: date(row.periodStart), end: date(row.periodEnd) })}</div></CardContent></Card>) : <Card><CardContent className="py-14 text-center text-sm text-muted">{t(locale, "platform.usage.empty")}</CardContent></Card>}</div></PlatformRequired>;
}
