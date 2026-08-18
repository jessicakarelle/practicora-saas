"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useState } from "react";
import { Plus, Users } from "lucide-react";
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
import { createCohort, listCohorts, listPrograms, type OrganizationCohort, type OrganizationProgram } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function CohortsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationCohort[]>([]);
  const [programs, setPrograms] = useState<OrganizationProgram[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ programId: "", name: "", startDate: "", endDate: "" });

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const [cohorts, programRows] = await Promise.all([listCohorts(organizationId), listPrograms(organizationId)]);
    setItems(cohorts); setPrograms(programRows); setLoading(false);
  }, [organizationId]);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !form.name.trim()) return;
    setSaving(true);
    const result = await createCohort(organizationId, form);
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(t(locale, "organization.cohorts.cohort_created"));
    setOpen(false); setForm({ programId: "", name: "", startDate: "", endDate: "" }); await load();
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.cohorts.cohorts")} description={t(locale, "organization.cohorts.group_students_by_term_program_or_cycle_to_automate_cohort_level_tracking")} actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />{t(locale, "organization.cohorts.new_cohort")}</Button>} />
    {loading ? <div className="h-52 animate-pulse rounded-2xl bg-surface-muted" /> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((cohort) => <Card key={cohort.id}><CardContent>
      <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info"><Users className="size-5" /></span><StatusBadge status={cohort.status} locale={locale} /></div>
      <h2 className="mt-4 text-lg font-extrabold">{cohort.name}</h2><p className="mt-1 text-sm font-semibold text-primary">{cohort.programName || (t(locale, "organization.cohorts.no_program_assigned"))}</p>
      <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-background p-3"><div className="text-xs font-bold uppercase tracking-[.08em] text-muted">{t(locale, "organization.cohorts.students")}</div><div className="mt-1 text-xl font-extrabold">{cohort.studentCount}</div></div><div className="rounded-xl bg-background p-3"><div className="text-xs font-bold uppercase tracking-[.08em] text-muted">{t(locale, "organization.cohorts.period")}</div><div className="mt-1 text-xs font-bold leading-5">{cohort.startDate || "—"}<br />{cohort.endDate || "—"}</div></div></div>
    </CardContent></Card>)}</div> : <EmptyState icon={Users} title={t(locale, "organization.cohorts.no_cohorts")} description={t(locale, "organization.cohorts.create_a_cohort_to_assign_students_teachers_and_shared_templates")} action={<Button onClick={() => setOpen(true)}>{t(locale, "organization.cohorts.create_cohort")}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={t(locale, "organization.cohorts.new_cohort")} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t(locale, "organization.cohorts.cancel")}</Button><Button form="cohort-form" type="submit" disabled={saving}>{saving ? (t(locale, "organization.cohorts.creating")) : (t(locale, "organization.cohorts.create"))}</Button></>}>
      <form id="cohort-form" className="space-y-4" onSubmit={submit}>
        <div><FieldLabel>{t(locale, "organization.cohorts.cohort_name")}</FieldLabel><Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder={t(locale, "organization.cohorts.co_op_summer_2027")} /></div>
        <div><FieldLabel>{t(locale, "organization.cohorts.program")}</FieldLabel><Select value={form.programId} onValueChange={(programId) => setForm((v) => ({ ...v, programId }))} placeholder={t(locale, "organization.cohorts.select_a_program")} options={[{ value: "", label: t(locale, "organization.cohorts.none_for_now") }, ...programs.map((p) => ({ value: p.id, label: p.name, description: p.code }))]} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "organization.cohorts.start_date")}</FieldLabel><DatePicker locale={locale} value={form.startDate} onChange={(startDate) => setForm((v) => ({ ...v, startDate }))} /></div><div><FieldLabel>{t(locale, "organization.cohorts.end_date")}</FieldLabel><DatePicker locale={locale} value={form.endDate} onChange={(endDate) => setForm((v) => ({ ...v, endDate }))} /></div></div>
      </form>
    </Modal>
  </OrganizationRequired>;
}
