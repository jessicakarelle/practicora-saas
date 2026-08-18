"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Building2, Filter, PauseCircle, PlayCircle, Search, Users } from "lucide-react";
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
import { listPlatformOrganizations, setPlatformOrganizationStatus, type PlatformOrganization } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformInstitutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [rows, setRows] = useState<PlatformOrganization[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<{ organization: PlatformOrganization; status: "active" | "suspended" | "archived" } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setRows(await listPlatformOrganizations(search, status));
    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const canManage = hasPlatformPermission("platform.organizations.manage");
  const statuses = useMemo(() => [
    { value: "all", label: t(locale, "platform.institutions.all_statuses") },
    { value: "active", label: t(locale, "platform.institutions.active") },
    { value: "suspended", label: t(locale, "platform.institutions.suspended") },
    { value: "archived", label: t(locale, "platform.institutions.archived") },
  ], [locale]);

  async function confirm(reason: string) {
    if (!pending) return;
    setBusy(true);
    try {
      await setPlatformOrganizationStatus(pending.organization.id, pending.status, reason);
      toast.success(t(locale, "platform.institutions.updated"));
      setPending(null);
      await load();
    } catch {
      toast.error(t(locale, "platform.institutions.operation_failed"));
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = (value: string) => t(locale, `platform.institutions.${value}`);

  return (
    <PlatformRequired locale={locale} permission="platform.organizations.view">
      <PageHeader title={t(locale, "platform.institutions.title")} description={t(locale, "platform.institutions.description")} />
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder={t(locale, "platform.institutions.search_placeholder")} /></div>
          <Select value={status} onValueChange={setStatus} startIcon={<Filter className="size-4" />} options={statuses} />
          <Button variant="secondary" onClick={() => void load()}>{t(locale, "common.navigation.refresh")}</Button>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-surface-muted" />) : rows.length ? rows.map((organization) => (
          <Card key={organization.id}>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Building2 className="size-5" /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-extrabold">{organization.name}</h2><StatusPill label={statusLabel(organization.status)} status={organization.status} /></div><p className="mt-1 truncate text-sm text-muted">{organization.slug} · {organization.type} · {organization.country}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t(locale, "platform.institutions.members")} value={organization.memberCount} />
                <Stat label={t(locale, "platform.institutions.students")} value={organization.studentCount} />
                <Stat label={t(locale, "platform.institutions.placements")} value={organization.activePlacements} />
                <Stat label={t(locale, "platform.institutions.plan")} value={organization.planCode || "—"} />
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
                {!canManage ? null : organization.status !== "active" ? <Button size="sm" variant="success" onClick={() => setPending({ organization, status: "active" })}><PlayCircle className="size-4" />{t(locale, "platform.institutions.reactivate")}</Button> : null}
                {!canManage ? null : organization.status === "active" ? <Button size="sm" variant="secondary" onClick={() => setPending({ organization, status: "suspended" })}><PauseCircle className="size-4" />{t(locale, "platform.institutions.suspend")}</Button> : null}
                {!canManage || organization.status === "archived" ? null : <Button size="sm" variant="danger" onClick={() => setPending({ organization, status: "archived" })}><Archive className="size-4" />{t(locale, "platform.institutions.archive")}</Button>}
                <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-muted"><Users className="size-3.5" />{new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(organization.createdAt))}</span>
              </div>
            </CardContent>
          </Card>
        )) : <Card className="xl:col-span-2"><CardContent className="py-14 text-center text-sm text-muted">{t(locale, "platform.institutions.empty")}</CardContent></Card>}
      </div>

      <ActionReasonDialog
        locale={locale}
        open={Boolean(pending)}
        title={t(locale, "platform.institutions.reason_title")}
        description={t(locale, "platform.institutions.reason_description")}
        confirmLabel={pending ? statusLabel(pending.status) : t(locale, "platform.institutions.confirm")}
        tone={pending?.status === "active" ? "primary" : "danger"}
        busy={busy}
        onClose={() => !busy && setPending(null)}
        onConfirm={confirm}
      />
    </PlatformRequired>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-background p-3"><div className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</div><div className="mt-1 truncate text-base font-extrabold tabular-nums">{value}</div></div>;
}
