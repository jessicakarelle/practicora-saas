"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useState } from "react";
import { Activity, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { listAuditEvents, type OrganizationAuditEvent } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationAuditEvent[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; void (async () => { if (!organizationId) return; setLoading(true); const rows = await listAuditEvents(organizationId); if (!cancelled) { setItems(rows); setLoading(false); } })(); return () => { cancelled = true; }; }, [organizationId]);
  const filtered = useMemo(() => items.filter((item) => `${item.action} ${item.entityType} ${item.actorName}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.audit.audit_log")} description={t(locale, "organization.audit.keep_a_record_of_invitations_role_changes_approvals_exports_and_administrative_a")} />
    <Card className="mb-5"><CardContent><div className="relative max-w-xl"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "organization.audit.search_action")} /></div></CardContent></Card>
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" /> : filtered.length ? <Card><div className="divide-y divide-border">{filtered.map((item) => <div key={item.id} className="flex gap-4 px-5 py-4 sm:px-6"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><ShieldCheck className="size-4.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-extrabold">{item.action}</h2><time className="text-xs text-muted">{item.createdAt ? new Intl.DateTimeFormat(t(locale, "organization.audit.en_ca"), { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt)) : "—"}</time></div><p className="mt-1 text-sm text-muted"><strong className="text-muted-strong">{item.actorName}</strong> · {item.entityType}{item.entityId ? ` · ${item.entityId.slice(0, 8)}` : ""}</p></div></div>)}</div></Card> : <EmptyState icon={Activity} title={t(locale, "organization.audit.no_audit_events")} description={t(locale, "organization.audit.sensitive_actions_will_appear_here_after_the_institutional_schema_is_configured")} />}
  </OrganizationRequired>;
}
