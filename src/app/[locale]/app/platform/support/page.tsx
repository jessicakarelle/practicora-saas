"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, LifeBuoy, PlayCircle, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { endPlatformSupportSession, listPlatformSupportSessions, startPlatformSupportSession, type PlatformSupportSession } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformSupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [sessions, setSessions] = useState<PlatformSupportSession[]>([]);
  const [targetType, setTargetType] = useState<"user" | "organization">("user");
  const [targetId, setTargetId] = useState("");
  const [mode, setMode] = useState<"read_only" | "assisted_write">("read_only");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setSessions(await listPlatformSupportSessions()), []);
  useEffect(() => { void load(); }, [load]);
  const canManage = hasPlatformPermission("platform.support.manage");
  const targetOptions = useMemo(() => [{ value: "user", label: t(locale, "platform.support.user") }, { value: "organization", label: t(locale, "platform.support.organization") }], [locale]);
  const modeOptions = useMemo(() => [{ value: "read_only", label: t(locale, "platform.support.read_only") }, { value: "assisted_write", label: t(locale, "platform.support.assisted_write") }], [locale]);

  async function start() {
    if (!canManage || !targetId || reason.trim().length < 10) return;
    setBusy(true);
    try { await startPlatformSupportSession({ targetType, targetId, mode, reason: reason.trim(), durationMinutes: Number(duration) || 30 }); toast.success(t(locale, "platform.support.started")); setTargetId(""); setReason(""); await load(); }
    catch { toast.error(t(locale, "platform.support.operation_failed")); }
    finally { setBusy(false); }
  }
  async function end(id: string) {
    setBusy(true);
    try { await endPlatformSupportSession(id, t(locale, "platform.support.ended")); toast.success(t(locale, "platform.support.ended")); await load(); }
    catch { toast.error(t(locale, "platform.support.operation_failed")); }
    finally { setBusy(false); }
  }
  const date = (value: string) => new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return <PlatformRequired locale={locale} permission="platform.support.view"><PageHeader title={t(locale, "platform.support.title")} description={t(locale, "platform.support.description")} /><div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]"><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.support.title")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.support.reason_required")}</p></div><LifeBuoy className="size-5 text-primary" /></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "platform.support.target_type")}</FieldLabel><Select value={targetType} onValueChange={(value) => setTargetType(value as "user" | "organization")} options={targetOptions} /></div><div><FieldLabel>{t(locale, "platform.support.mode")}</FieldLabel><Select value={mode} onValueChange={(value) => setMode(value as "read_only" | "assisted_write")} options={modeOptions} /></div></div><div><FieldLabel>{t(locale, "platform.support.target_id")}</FieldLabel><Input value={targetId} onChange={(event) => setTargetId(event.target.value)} /></div><div><FieldLabel>{t(locale, "platform.support.duration")}</FieldLabel><Select value={duration} onValueChange={setDuration} options={["15","30","60","120"].map((value) => ({ value, label: `${value} ${t(locale, "platform.support.minutes")}` }))} /></div><div><FieldLabel>{t(locale, "platform.support.reason")}</FieldLabel><Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-28" /></div><Button className="w-full" disabled={!canManage || busy || !targetId || reason.trim().length < 10} onClick={() => void start()}><PlayCircle className="size-4" />{t(locale, "platform.support.start")}</Button></CardContent></Card><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.support.active_sessions")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.support.future_notice")}</p></div></CardHeader><CardContent className="space-y-3">{sessions.length ? sessions.map((session) => <div key={session.id} className="rounded-2xl border border-border bg-background p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><LifeBuoy className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{t(locale, `platform.support.${session.targetType}`)} · {session.targetId}</h3><StatusPill label={session.status} status={session.status} /></div><p className="mt-2 text-sm leading-6 text-muted-strong">{session.reason}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted"><span>{t(locale, `platform.support.${session.mode}`)}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{t(locale, "platform.support.expires")}: {date(session.expiresAt)}</span></div></div>{canManage && session.status === "active" ? <Button size="sm" variant="danger" disabled={busy} onClick={() => void end(session.id)}><StopCircle className="size-4" />{t(locale, "platform.support.end")}</Button> : null}</div></div>) : <div className="py-12 text-center text-sm text-muted">{t(locale, "platform.support.empty")}</div>}</CardContent></Card></div></PlatformRequired>;
}
