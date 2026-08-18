"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveRestore, Database, Download, ShieldX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { createPlatformDataRequest, listPlatformDataRequests, type PlatformDataRequest } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformDataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [rows, setRows] = useState<PlatformDataRequest[]>([]);
  const [requestType, setRequestType] = useState<PlatformDataRequest["requestType"]>("export");
  const [subjectType, setSubjectType] = useState<PlatformDataRequest["subjectType"]>("user");
  const [subjectId, setSubjectId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setRows(await listPlatformDataRequests()), []);
  useEffect(() => { void load(); }, [load]);
  const canManage = hasPlatformPermission("platform.data.manage");
  const requestOptions = useMemo(() => (["export", "deletion", "retention_hold", "restore"] as const).map((value) => ({ value, label: t(locale, `platform.data.${value}`) })), [locale]);
  const subjectOptions = useMemo(() => (["user", "organization"] as const).map((value) => ({ value, label: t(locale, `platform.data.${value}`) })), [locale]);

  async function create() {
    if (!canManage || !subjectId || reason.trim().length < 10) return;
    setBusy(true);
    try { await createPlatformDataRequest({ requestType, subjectType, subjectId, reason: reason.trim() }); toast.success(t(locale, "platform.data.created")); setSubjectId(""); setReason(""); await load(); }
    catch { toast.error(t(locale, "platform.data.operation_failed")); }
    finally { setBusy(false); }
  }
  const date = (value: string) => new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const icon = { export: Download, deletion: Trash2, retention_hold: ShieldX, restore: ArchiveRestore };

  return <PlatformRequired locale={locale} permission="platform.data.view"><PageHeader title={t(locale, "platform.data.title")} description={t(locale, "platform.data.description")} /><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.data.create")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.data.future_notice")}</p></div><Database className="size-5 text-primary" /></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "platform.data.request_type")}</FieldLabel><Select value={requestType} onValueChange={(value) => setRequestType(value as PlatformDataRequest["requestType"])} options={requestOptions} /></div><div><FieldLabel>{t(locale, "platform.data.subject_type")}</FieldLabel><Select value={subjectType} onValueChange={(value) => setSubjectType(value as PlatformDataRequest["subjectType"])} options={subjectOptions} /></div></div><div><FieldLabel>{t(locale, "platform.data.subject_id")}</FieldLabel><Input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} /></div><div><FieldLabel>{t(locale, "platform.data.reason")}</FieldLabel><Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28" /></div><Button className="w-full" disabled={!canManage || busy || !subjectId || reason.trim().length < 10} onClick={() => void create()}>{t(locale, "platform.data.create")}</Button></CardContent></Card><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.data.requests")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.data.description")}</p></div></CardHeader><CardContent className="space-y-3">{rows.length ? rows.map((row) => { const Icon = icon[row.requestType]; return <div key={row.id} className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{t(locale, `platform.data.${row.requestType}`)}</h3><StatusPill label={t(locale, `platform.data.${row.status}`)} status={row.status} /></div><p className="mt-1 truncate text-sm text-muted">{t(locale, `platform.data.${row.subjectType}`)} · {row.subjectId}</p><p className="mt-2 text-sm leading-6 text-muted-strong">{row.reason}</p><div className="mt-2 text-xs text-muted">{t(locale, "platform.data.requested_at")}: {date(row.requestedAt)}</div>{row.resultLocation ? <a href={row.resultLocation} className="mt-3 inline-flex font-bold text-primary">{t(locale, "platform.data.result")}</a> : null}</div></div></div>; }) : <div className="py-12 text-center text-sm text-muted">{t(locale, "platform.data.empty")}</div>}</CardContent></Card></div></PlatformRequired>;
}
