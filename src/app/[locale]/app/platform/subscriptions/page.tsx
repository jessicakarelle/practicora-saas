"use client";

import { use, useEffect, useState } from "react";
import { Building2, CalendarClock, CircleDollarSign, UserRound } from "lucide-react";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformSubscriptions, type PlatformSubscription } from "@/lib/platform";

export default function PlatformSubscriptionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [rows, setRows] = useState<PlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; void listPlatformSubscriptions().then((data) => { if (!cancelled) { setRows(data); setLoading(false); } }); return () => { cancelled = true; }; }, []);
  const date = (value: string | null) => value ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(value)) : "—";
  const status = (value: string) => { const result = t(locale, `platform.subscriptions.${value}`); return result.startsWith("platform.subscriptions.") ? value : result; };
  return <PlatformRequired locale={locale} permission="platform.subscriptions.view"><PageHeader title={t(locale, "platform.subscriptions.title")} description={t(locale, "platform.subscriptions.description")} /><div className="grid gap-4 xl:grid-cols-2">{loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-2xl bg-surface-muted" />) : rows.length ? rows.map((row) => <Card key={row.id}><CardContent className="space-y-4"><div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">{row.ownerType === "organization" ? <Building2 className="size-4.5" /> : <UserRound className="size-4.5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-extrabold">{row.ownerName}</h2><StatusPill label={status(row.status)} status={row.status} /></div><p className="mt-1 text-sm text-muted">{row.ownerType === "organization" ? t(locale, "platform.subscriptions.institution") : t(locale, "platform.subscriptions.personal")}</p></div></div><div className="grid gap-3 sm:grid-cols-3"><Info icon={CircleDollarSign} label={t(locale, "platform.subscriptions.plan")} value={row.planCode} /><Info icon={CircleDollarSign} label={t(locale, "platform.subscriptions.price")} value={`${new Intl.NumberFormat(localeTag(locale), { style: "currency", currency: row.currency }).format(row.amountCents / 100)} · ${status(row.billingInterval === "month" ? "monthly" : row.billingInterval === "year" ? "yearly" : "custom")}`} /><Info icon={CalendarClock} label={t(locale, "platform.subscriptions.renewal")} value={date(row.currentPeriodEnd)} /></div></CardContent></Card>) : <Card className="xl:col-span-2"><CardContent className="py-14 text-center text-sm text-muted">{t(locale, "platform.subscriptions.empty")}</CardContent></Card>}</div></PlatformRequired>;
}
function Info({ icon: Icon, label, value }: { icon: typeof CircleDollarSign; label: string; value: string }) { return <div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.07em] text-muted"><Icon className="size-3.5" />{label}</div><div className="mt-1.5 truncate text-sm font-extrabold">{value || "—"}</div></div>; }
