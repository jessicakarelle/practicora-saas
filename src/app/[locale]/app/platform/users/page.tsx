"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Filter, LockKeyhole, PlayCircle, Search, ShieldAlert, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { ActionReasonDialog } from "@/components/platform/action-reason-dialog";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { listPlatformUsers, setPlatformAccountStatus, type PlatformUser } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [rows, setRows] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ user: PlatformUser; status: "active" | "restricted" | "suspended" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await listPlatformUsers(search, status));
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const canManage = hasPlatformPermission("platform.users.manage");
  const statuses = useMemo(() => [
    { value: "all", label: t(locale, "platform.users.all_statuses") },
    { value: "active", label: t(locale, "platform.users.active") },
    { value: "restricted", label: t(locale, "platform.users.restricted") },
    { value: "suspended", label: t(locale, "platform.users.suspended") },
  ], [locale]);

  async function confirm(reason: string) {
    if (!pending) return;
    setBusy(true);
    try {
      await setPlatformAccountStatus(pending.user.id, pending.status, reason);
      toast.success(t(locale, "platform.users.updated"));
      setPending(null);
      await load();
    } catch {
      toast.error(t(locale, "platform.users.operation_failed"));
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = (value: string) => t(locale, `platform.users.${value}`);
  const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : t(locale, "platform.users.never");

  return (
    <PlatformRequired locale={locale} permission="platform.users.view">
      <PageHeader title={t(locale, "platform.users.title")} description={t(locale, "platform.users.description")} />
      <Card><CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder={t(locale, "platform.users.search_placeholder")} /></div><Select value={status} onValueChange={setStatus} startIcon={<Filter className="size-4" />} options={statuses} /><Button variant="secondary" onClick={() => void load()}>{t(locale, "common.navigation.refresh")}</Button></CardContent></Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-surface-muted" />) : rows.length ? rows.map((user) => (
          <Card key={user.id}><CardContent className="space-y-5">
            <div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><UserRound className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-extrabold">{user.fullName || user.email}</h2><StatusPill label={statusLabel(user.accountStatus)} status={user.accountStatus} /></div><p className="mt-1 truncate text-sm text-muted">{user.email}</p></div></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label={t(locale, "platform.users.email_status")} value={user.emailConfirmed ? t(locale, "platform.users.verified") : t(locale, "platform.users.unverified")} icon={user.emailConfirmed ? CheckCircle2 : XCircle} />
              <Info label={t(locale, "platform.users.organizations")} value={String(user.organizationCount)} icon={LockKeyhole} />
              <Info label={t(locale, "platform.users.last_sign_in")} value={formatDate(user.lastSignInAt)} icon={UserRound} />
            </div>
            {user.organizationNames ? <p className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm leading-6 text-muted-strong">{user.organizationNames}</p> : null}
            <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
              {!canManage || user.accountStatus === "active" ? null : <Button size="sm" variant="success" onClick={() => setPending({ user, status: "active" })}><PlayCircle className="size-4" />{t(locale, "platform.users.reactivate")}</Button>}
              {!canManage || user.accountStatus === "restricted" ? null : <Button size="sm" variant="secondary" onClick={() => setPending({ user, status: "restricted" })}><ShieldAlert className="size-4" />{t(locale, "platform.users.restrict")}</Button>}
              {!canManage || user.accountStatus === "suspended" ? null : <Button size="sm" variant="danger" onClick={() => setPending({ user, status: "suspended" })}><LockKeyhole className="size-4" />{t(locale, "platform.users.suspend")}</Button>}
              <span className="ml-auto self-center text-xs font-bold text-muted">{new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(user.createdAt))}</span>
            </div>
          </CardContent></Card>
        )) : <Card className="xl:col-span-2"><CardContent className="py-14 text-center text-sm text-muted">{t(locale, "platform.users.empty")}</CardContent></Card>}
      </div>

      <ActionReasonDialog locale={locale} open={Boolean(pending)} title={t(locale, "platform.users.reason_title")} description={t(locale, "platform.users.reason_description")} confirmLabel={pending ? statusLabel(pending.status) : t(locale, "common.navigation.confirm")} tone={pending?.status === "active" ? "primary" : "danger"} busy={busy} onClose={() => !busy && setPending(null)} onConfirm={confirm} />
    </PlatformRequired>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserRound }) {
  return <div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.07em] text-muted"><Icon className="size-3.5" />{label}</div><div className="mt-1.5 truncate text-sm font-extrabold">{value}</div></div>;
}
