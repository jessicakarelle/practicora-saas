"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, FileCheck2, GraduationCap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterPanel } from "@/components/ui/filter-panel";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { listInstitutionalReports, listPlacements, organizationDashboard, type InstitutionalReport, type OrganizationDashboard, type OrganizationPlacement } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

const empty: OrganizationDashboard = { memberCount: 0, studentCount: 0, teacherCount: 0, activePlacements: 0, reportsWaiting: 0, atRiskPlacements: 0, completionRate: 0 };

export default function OrganizationAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [metrics, setMetrics] = useState(empty);
  const [placements, setPlacements] = useState<OrganizationPlacement[]>([]);
  const [reports, setReports] = useState<InstitutionalReport[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placementStatus, setPlacementStatus] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");

  useEffect(() => { let cancelled = false; void (async () => { if (!organizationId) return; const [m, p, r] = await Promise.all([organizationDashboard(organizationId), listPlacements(organizationId), listInstitutionalReports(organizationId, locale)]); if (!cancelled) { setMetrics(m); setPlacements(p); setReports(r); } })(); return () => { cancelled = true; }; }, [locale, organizationId]);

  const filteredPlacements = useMemo(() => { const normalized=query.trim().toLowerCase(); return placements.filter((item)=>(placementStatus==="all"||item.status===placementStatus)&&(!normalized||`${item.studentName} ${item.company} ${item.roleTitle} ${item.teacherName} ${item.supervisorName}`.toLowerCase().includes(normalized))); },[placementStatus,placements,query]);
  const filteredReports = useMemo(() => reports.filter((item)=>reportStatus==="all"||item.status===reportStatus),[reportStatus,reports]);
  const placementStatuses = useMemo(()=>Array.from(new Set(placements.map((item)=>item.status))),[placements]);
  const reportStatuses = useMemo(()=>Array.from(new Set(reports.map((item)=>item.status))),[reports]);
  const progressData = useMemo(() => filteredPlacements.slice(0, 12).map((item) => ({ name: item.studentName.split(" ")[0] || item.company, progress: item.requiredHours ? Math.min(100, Math.round(item.loggedHours / item.requiredHours * 100)) : 0 })), [filteredPlacements]);
  const statusData = useMemo(() => {
    const counts = new Map<string, number>(); filteredReports.forEach((item) => counts.set(item.status, (counts.get(item.status) || 0) + 1));
    return Array.from(counts, ([name, value]) => ({ name, value }));
  }, [filteredReports]);
  const colors = ["#2f6f9f", "#2f7d5b", "#a96b1d", "#b74652", "#6f5aa8", "#4f7c8e"];

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.analytics.institution_analytics")} description={t(locale, "organization.analytics.turn_hours_submissions_and_approvals_into_progress_indicators_without_exposing_o")} />
    <div className="mb-5"><FilterPanel title={t(locale,"organization.analytics.filters")} summary={t(locale,"organization.analytics.filtered_summary",{placements:filteredPlacements.length,reports:filteredReports.length})} open={filtersOpen} onOpenChange={setFiltersOpen} clearLabel={t(locale,"organization.analytics.clear_filters")} onClear={()=>{setQuery("");setPlacementStatus("all");setReportStatus("all")}}><div className="grid gap-3 md:grid-cols-3"><Input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder={t(locale,"organization.analytics.search_placeholder")}/><Select value={placementStatus} onValueChange={setPlacementStatus} options={[{value:"all",label:t(locale,"organization.analytics.all_placement_statuses")},...placementStatuses.map((value)=>({value,label:value}))]}/><Select value={reportStatus} onValueChange={setReportStatus} options={[{value:"all",label:t(locale,"organization.analytics.all_report_statuses")},...reportStatuses.map((value)=>({value,label:value}))]}/></div></FilterPanel></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={GraduationCap} label={t(locale, "organization.analytics.students")} value={String(metrics.studentCount)} /><MetricCard icon={Activity} label={t(locale, "organization.analytics.average_completion")} value={`${metrics.completionRate.toFixed(0)}%`} tone="info" /><MetricCard icon={FileCheck2} label={t(locale, "organization.analytics.reports_to_process")} value={String(metrics.reportsWaiting)} tone="warning" /><MetricCard icon={AlertTriangle} label={t(locale, "organization.analytics.at_risk_placements")} value={String(metrics.atRiskPlacements)} tone={metrics.atRiskPlacements ? "warning" : "success"} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "organization.analytics.hours_completion")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.analytics.percentage_of_required_placement_hours")}</p></div><BarChart3 className="size-5 text-primary" /></CardHeader><CardContent><div className="h-[320px] w-full">{progressData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={progressData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.28} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, t(locale, "organization.analytics.completion")]} /><Bar dataKey="progress" fill="#2f6f9f" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <ChartEmpty text={t(locale, "organization.analytics.no_placements_to_analyze")} />}</div></CardContent></Card>
      <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "organization.analytics.report_statuses")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.analytics.distribution_of_drafts_submissions_changes_and_approvals")}</p></div></CardHeader><CardContent><div className="h-[320px] w-full">{statusData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>{statusData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" height={36} /></PieChart></ResponsiveContainer> : <ChartEmpty text={t(locale, "organization.analytics.no_reports_to_analyze")} />}</div></CardContent></Card>
    </div>
  </OrganizationRequired>;
}

function ChartEmpty({ text }: { text: string }) { return <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm font-semibold text-muted">{text}</div>; }
