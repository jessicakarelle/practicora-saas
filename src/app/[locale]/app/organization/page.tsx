"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  MailPlus,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { organizationDashboard, type OrganizationDashboard } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

const empty: OrganizationDashboard = {
  memberCount: 0,
  studentCount: 0,
  teacherCount: 0,
  activePlacements: 0,
  reportsWaiting: 0,
  atRiskPlacements: 0,
  completionRate: 0,
};

export default function OrganizationDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const [metrics, setMetrics] = useState<OrganizationDashboard>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (activeWorkspace?.kind !== "organization") return;
      setLoading(true);
      const next = await organizationDashboard(activeWorkspace.organizationId);
      if (!cancelled) {
        setMetrics(next);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  return (
    <OrganizationRequired locale={locale}>
      <PageHeader
        title={t(locale, "organization.dashboard.institution_dashboard")}
        description={t(locale, "organization.dashboard.automatically_track_cohorts_placements_reports_approvals_and_risk_signals_across")}
        actions={<ButtonLink href={`/${locale}/app/organization/invitations`}><MailPlus className="size-4" />{t(locale, "organization.dashboard.invite_member")}</ButtonLink>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={GraduationCap} label={t(locale, "organization.dashboard.active_students")} value={loading ? "—" : String(metrics.studentCount)} meta={t(locale, "organization.dashboard.total_members_meta", { count: metrics.memberCount })} />
        <MetricCard icon={BriefcaseBusiness} label={t(locale, "organization.dashboard.active_placements")} value={loading ? "—" : String(metrics.activePlacements)} meta={t(locale, "organization.dashboard.current_assignments")} tone="info" />
        <MetricCard icon={FileCheck2} label={t(locale, "organization.dashboard.reports_waiting")} value={loading ? "—" : String(metrics.reportsWaiting)} meta={t(locale, "organization.dashboard.review_or_approval")} tone="warning" />
        <MetricCard icon={AlertTriangle} label={t(locale, "organization.dashboard.placements_at_risk")} value={loading ? "—" : String(metrics.atRiskPlacements)} meta={`${metrics.completionRate.toFixed(0)}% ${t(locale, "organization.dashboard.average_completion")}`} tone={metrics.atRiskPlacements ? "warning" : "success"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "organization.dashboard.automation_center")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.dashboard.checks_are_recalculated_from_real_data_and_program_rules")}</p></div><Sparkles className="size-5 text-primary" /></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <AutomationItem icon={ShieldCheck} title={t(locale, "organization.dashboard.roles_resolved_at_sign_in")} description={t(locale, "organization.dashboard.each_person_automatically_opens_the_dashboard_linked_to_verified_memberships")} ok />
            <AutomationItem icon={FileCheck2} title={t(locale, "organization.dashboard.missing_reports_detected")} description={t(locale, "organization.dashboard.deadlines_and_statuses_automatically_feed_the_review_queue")} ok={metrics.reportsWaiting === 0} />
            <AutomationItem icon={AlertTriangle} title={t(locale, "organization.dashboard.at_risk_placement_alerts")} description={t(locale, "organization.dashboard.low_hours_late_submissions_and_missing_approvals_can_trigger_an_alert")} ok={metrics.atRiskPlacements === 0} />
            <AutomationItem icon={CheckCircle2} title={t(locale, "organization.dashboard.autosave_and_audit")} description={t(locale, "organization.dashboard.sensitive_actions_are_audited_while_ordinary_forms_save_automatically")} ok />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "organization.dashboard.recommended_setup")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.dashboard.complete_these_items_to_make_the_workspace_operational")}</p></div></CardHeader>
          <CardContent className="space-y-2">
            <SetupLink href={`/${locale}/app/organization/programs`} icon={BarChart3} label={t(locale, "organization.dashboard.create_a_program")} />
            <SetupLink href={`/${locale}/app/organization/cohorts`} icon={Users} label={t(locale, "organization.dashboard.create_a_cohort")} />
            <SetupLink href={`/${locale}/app/organization/templates`} icon={FileCheck2} label={t(locale, "organization.dashboard.configure_report_templates")} />
            <SetupLink href={`/${locale}/app/organization/invitations`} icon={MailPlus} label={t(locale, "organization.dashboard.invite_staff_and_students")} />
          </CardContent>
        </Card>
      </div>
    </OrganizationRequired>
  );
}

function AutomationItem({ icon: Icon, title, description, ok }: { icon: typeof ShieldCheck; title: string; description: string; ok: boolean }) {
  return <div className="rounded-2xl border border-border bg-background p-4"><div className="flex items-start gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}><Icon className="size-4.5" /></span><div><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div></div></div>;
}

function SetupLink({ href, icon: Icon, label }: { href: string; icon: typeof BarChart3; label: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-sm font-bold hover:border-primary/25 hover:bg-primary-softer"><span className="flex size-8 items-center justify-center rounded-lg bg-primary-softer text-primary"><Icon className="size-4" /></span><span className="min-w-0 flex-1">{label}</span><span className="text-primary">→</span></Link>;
}
