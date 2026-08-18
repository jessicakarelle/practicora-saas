"use client";

import { translate as t } from "@/i18n";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, FileCheck2, GraduationCap } from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listInstitutionalReports, listPlacements, organizationDashboard, type InstitutionalReport, type OrganizationDashboard, type OrganizationPlacement } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

const empty: OrganizationDashboard = { memberCount: 0, studentCount: 0, teacherCount: 0, activePlacements: 0, reportsWaiting: 0, atRiskPlacements: 0, completionRate: 0 };

export function RoleDashboard({ locale, role }: { locale: string; role: "program" | "teacher" | "supervisor" }) {
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [metrics, setMetrics] = useState(empty);
  const [placements, setPlacements] = useState<OrganizationPlacement[]>([]);
  const [reports, setReports] = useState<InstitutionalReport[]>([]);
  useEffect(() => { let cancelled = false; void (async () => { if (!organizationId) return; const [m, p, r] = await Promise.all([organizationDashboard(organizationId), listPlacements(organizationId), listInstitutionalReports(organizationId, locale)]); if (!cancelled) { setMetrics(m); setPlacements(p); setReports(r); } })(); return () => { cancelled = true; }; }, [locale, organizationId]);
  const pending = useMemo(() => reports.filter((item) => ["submitted", "in_review", "changes_requested"].includes(item.status)).slice(0, 5), [reports]);
  const titleKey = `common.misc.${role}_title`;
  const descriptionKey = `common.misc.${role}_description`;

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, titleKey)} description={t(locale, descriptionKey)} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={GraduationCap} label={t(locale, "common.misc.accessible_students")} value={String(metrics.studentCount)} /><MetricCard icon={BriefcaseBusiness} label={t(locale, "common.misc.active_placements")} value={String(metrics.activePlacements)} tone="info" /><MetricCard icon={FileCheck2} label={t(locale, "common.misc.reports_to_process")} value={String(metrics.reportsWaiting)} tone="warning" /><MetricCard icon={AlertTriangle} label={t(locale, "common.misc.at_risk")} value={String(metrics.atRiskPlacements)} tone={metrics.atRiskPlacements ? "warning" : "success"} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "common.misc.recent_placements")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.visibility_is_automatically_filtered_by_your_assignments")}</p></div><Link href={`/${locale}/app/organization/placements`} className="text-sm font-bold text-primary">{t(locale, "common.misc.view_all")}</Link></CardHeader><CardContent className="space-y-3">{placements.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><BriefcaseBusiness className="size-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{item.studentName || item.company}</div><div className="mt-0.5 truncate text-xs text-muted">{item.company} · {item.loggedHours.toFixed(1)} / {item.requiredHours} {t(locale, "common.misc.hour_short")}</div></div><StatusBadge status={item.status} locale={locale} /></div>)}{!placements.length ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">{t(locale, "common.misc.no_accessible_placements")}</p> : null}</CardContent></Card>
      <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "common.misc.review_queue")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.submissions_and_changes_that_need_action")}</p></div><Link href={`/${locale}/app/organization/reports`} className="text-sm font-bold text-primary">{t(locale, "common.misc.open_queue")}</Link></CardHeader><CardContent className="space-y-3">{pending.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning"><FileCheck2 className="size-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{item.title}</div><div className="mt-0.5 truncate text-xs text-muted">{item.studentName} · {item.periodLabel}</div></div><StatusBadge status={item.status} locale={locale} /></div>)}{!pending.length ? <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/8 p-4"><CheckCircle2 className="size-5 text-success" /><p className="text-sm font-bold text-success">{t(locale, "common.misc.no_pending_action")}</p></div> : null}</CardContent></Card>
    </div>
  </OrganizationRequired>;
}
