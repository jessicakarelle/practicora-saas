"use client";

import { use, useEffect, useState } from "react";
import { Activity, Braces, Clock3, UserRound } from "lucide-react";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformAuditEvents, type PlatformAuditEvent } from "@/lib/platform";

export default function PlatformAuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [rows, setRows] = useState<PlatformAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; void listPlatformAuditEvents().then((data) => { if (!cancelled) { setRows(data); setLoading(false); } }); return () => { cancelled = true; }; }, []);
  const date = (value: string) => new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <PlatformRequired locale={locale} permission="platform.audit.view"><PageHeader title={t(locale, "platform.audit.title")} description={t(locale, "platform.audit.description")} /><div className="space-y-3">{loading ? Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-surface-muted" />) : rows.length ? rows.map((row) => <Card key={row.id}><CardContent className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_220px]"><div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Activity className="size-4" /></span><div className="min-w-0"><div className="truncate text-sm font-extrabold">{row.action}</div><div className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3.5" />{date(row.createdAt)}</div></div></div><div className="space-y-2"><div className="flex items-center gap-2 text-sm"><UserRound className="size-4 text-muted" /><span className="font-bold">{row.actorEmail || t(locale, "platform.audit.unknown_actor")}</span></div><div className="text-sm text-muted-strong"><strong>{t(locale, "platform.audit.target")}:</strong> {row.targetType} · {row.targetId || "—"}</div>{row.reason ? <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm leading-6 text-muted-strong"><strong>{t(locale, "platform.audit.reason")}:</strong> {row.reason}</div> : null}</div><details className="rounded-xl border border-border bg-background p-3"><summary className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-muted-strong"><Braces className="size-3.5" />{t(locale, "platform.audit.metadata")}</summary><pre className="practicora-scroll mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[11px] text-muted">{JSON.stringify(row.metadata, null, 2)}</pre></details></CardContent></Card>) : <Card><CardContent className="py-14 text-center text-sm text-muted">{t(locale, "platform.audit.empty")}</CardContent></Card>}</div></PlatformRequired>;
}
