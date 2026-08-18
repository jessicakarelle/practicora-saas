"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { createPlacement, listCohorts, listOrganizationMembers, listPlacements, type OrganizationCohort, type OrganizationMember, type OrganizationPlacement } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function PlacementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationPlacement[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [cohorts, setCohorts] = useState<OrganizationCohort[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentUserId: "", company: "", roleTitle: "", teacherUserId: "", supervisorUserId: "", cohortId: "", startDate: "", endDate: "", requiredHours: 240 });

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const [placements, memberRows, cohortRows] = await Promise.all([listPlacements(organizationId), listOrganizationMembers(organizationId), listCohorts(organizationId)]);
    setItems(placements); setMembers(memberRows); setCohorts(cohortRows); setLoading(false);
  }, [organizationId]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.studentName} ${item.company} ${item.roleTitle}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "all" || item.status === status);
  }), [items, query, status]);
  const students = members.filter((member) => member.roles.includes("student"));
  const teachers = members.filter((member) => member.roles.includes("teacher") || member.roles.includes("program_manager"));
  const supervisors = members.filter((member) => member.roles.includes("supervisor"));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !form.studentUserId || !form.company.trim()) {
      toast.error(t(locale, "organization.placements.choose_a_student_and_company"));
      return;
    }
    setSaving(true);
    const result = await createPlacement(organizationId, form);
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(t(locale, "organization.placements.placement_created"));
    setOpen(false); setForm({ studentUserId: "", company: "", roleTitle: "", teacherUserId: "", supervisorUserId: "", cohortId: "", startDate: "", endDate: "", requiredHours: 240 }); await load();
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.placements.placements")} description={t(locale, "organization.placements.connect_each_student_to_a_company_teacher_supervisor_period_and_required_hour_ta")} actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />{t(locale, "organization.placements.new_placement")}</Button>} />
    <Card className="mb-5"><CardContent className="grid gap-3 sm:grid-cols-[1fr_210px]"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "organization.placements.search_student_or_company")} /></div><Select value={status} onValueChange={setStatus} options={[{ value: "all", label: t(locale, "organization.placements.all_statuses") }, { value: "planned", label: t(locale, "organization.placements.planned") }, { value: "active", label: t(locale, "organization.placements.active") }, { value: "completed", label: t(locale, "organization.placements.completed") }, { value: "at_risk", label: t(locale, "organization.placements.at_risk") }]} /></CardContent></Card>
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" /> : filtered.length ? <div className="grid gap-4 xl:grid-cols-2">{filtered.map((placement) => {
      const progress = placement.requiredHours > 0 ? Math.min(100, placement.loggedHours / placement.requiredHours * 100) : 0;
      const atRisk = placement.status === "at_risk" || progress < 25;
      return <Card key={placement.id}><CardContent>
        <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${atRisk ? "bg-warning/10 text-warning" : "bg-primary-softer text-primary"}`}>{atRisk ? <AlertTriangle className="size-5" /> : <BriefcaseBusiness className="size-5" />}</span><div className="min-w-0"><h2 className="truncate text-lg font-extrabold">{placement.studentName || (t(locale, "organization.placements.student"))}</h2><p className="mt-1 truncate text-sm font-semibold text-primary">{placement.company}</p><p className="mt-0.5 truncate text-xs text-muted">{placement.roleTitle || "—"}</p></div></div><StatusBadge status={placement.status} locale={locale} /></div>
        <div className="mt-5"><div className="flex justify-between gap-3 text-xs font-bold text-muted"><span>{t(locale, "organization.placements.hours_progress")}</span><span>{placement.loggedHours.toFixed(1)} / {placement.requiredHours} {t(locale, "common.misc.hour_short")}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-border"><div className={`h-full rounded-full ${atRisk ? "bg-warning" : "bg-primary"}`} style={{ width: `${progress}%` }} /></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-background p-3 text-sm"><div className="text-xs font-bold uppercase tracking-[.08em] text-muted">{t(locale, "organization.placements.teacher")}</div><div className="mt-1 font-bold">{placement.teacherName || "—"}</div></div><div className="rounded-xl bg-background p-3 text-sm"><div className="text-xs font-bold uppercase tracking-[.08em] text-muted">{t(locale, "organization.placements.supervisor")}</div><div className="mt-1 font-bold">{placement.supervisorName || "—"}</div></div></div>
      </CardContent></Card>;
    })}</div> : <EmptyState icon={BriefcaseBusiness} title={t(locale, "organization.placements.no_placements_found")} description={t(locale, "organization.placements.create_a_complete_assignment_or_change_the_filters")} action={<Button onClick={() => setOpen(true)}>{t(locale, "organization.placements.create_placement")}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={t(locale, "organization.placements.new_placement")} size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t(locale, "organization.placements.cancel")}</Button><Button form="placement-form" type="submit" disabled={saving}>{saving ? (t(locale, "organization.placements.creating")) : (t(locale, "organization.placements.create_placement_2"))}</Button></>}>
      <form id="placement-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2"><FieldLabel>{t(locale, "organization.placements.student")}</FieldLabel><Select value={form.studentUserId} onValueChange={(studentUserId) => setForm((v) => ({ ...v, studentUserId }))} placeholder={t(locale, "organization.placements.choose_student")} options={students.map((item) => ({ value: item.userId, label: item.fullName || item.email, description: item.email }))} /></div>
        <div><FieldLabel>{t(locale, "organization.placements.company")}</FieldLabel><Input value={form.company} onChange={(e) => setForm((v) => ({ ...v, company: e.target.value }))} /></div><div><FieldLabel>{t(locale, "organization.placements.intern_role")}</FieldLabel><Input value={form.roleTitle} onChange={(e) => setForm((v) => ({ ...v, roleTitle: e.target.value }))} /></div>
        <div><FieldLabel>{t(locale, "organization.placements.teacher")}</FieldLabel><Select value={form.teacherUserId} onValueChange={(teacherUserId) => setForm((v) => ({ ...v, teacherUserId }))} options={[{ value: "", label: t(locale, "organization.placements.unassigned") }, ...teachers.map((item) => ({ value: item.userId, label: item.fullName || item.email }))]} /></div><div><FieldLabel>{t(locale, "organization.placements.supervisor")}</FieldLabel><Select value={form.supervisorUserId} onValueChange={(supervisorUserId) => setForm((v) => ({ ...v, supervisorUserId }))} options={[{ value: "", label: t(locale, "organization.placements.unassigned") }, ...supervisors.map((item) => ({ value: item.userId, label: item.fullName || item.email }))]} /></div>
        <div><FieldLabel>{t(locale, "organization.placements.cohort")}</FieldLabel><Select value={form.cohortId} onValueChange={(cohortId) => setForm((v) => ({ ...v, cohortId }))} options={[{ value: "", label: t(locale, "organization.placements.no_cohort") }, ...cohorts.map((item) => ({ value: item.id, label: item.name, description: item.programName }))]} /></div><div><FieldLabel>{t(locale, "organization.placements.required_hours")}</FieldLabel><Input type="number" min={1} value={form.requiredHours} onChange={(e) => setForm((v) => ({ ...v, requiredHours: Number(e.target.value) }))} /></div>
        <div><FieldLabel>{t(locale, "organization.placements.start_date")}</FieldLabel><DatePicker locale={locale} value={form.startDate} onChange={(startDate) => setForm((v) => ({ ...v, startDate }))} /></div><div><FieldLabel>{t(locale, "organization.placements.end_date")}</FieldLabel><DatePicker locale={locale} value={form.endDate} onChange={(endDate) => setForm((v) => ({ ...v, endDate }))} /></div>
      </form>
    </Modal>
  </OrganizationRequired>;
}
