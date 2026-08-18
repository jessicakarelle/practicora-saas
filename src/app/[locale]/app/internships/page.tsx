"use client";

import { translate as t } from "@/i18n";

import { use, useState } from "react";
import { BriefcaseBusiness, Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useStageLog } from "@/lib/store";
import type { Internship } from "@/lib/types";

const emptyStage: Omit<Internship, "id" | "createdAt"> = {
  name: "",
  company: "",
  role: "",
  department: "",
  industry: "",
  location: "",
  workMode: "onsite",
  status: "active",
  supervisor: "",
  supervisorEmail: "",
  supervisorPhone: "",
  school: "",
  teacher: "",
  teacherEmail: "",
  description: "",
  startDate: "",
  endDate: "",
  goalHours: 240,
  weeklyGoalHours: 35,
};

export default function InternshipsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const dialog = useDialog();
  const { data, activeInternship, setActiveInternship, addInternship, updateInternship, deleteInternship } = useStageLog();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyStage);

  async function createStage() {
    const issues: string[] = [];
    if (!draft.name.trim()) issues.push(t(locale, "app.internships.add_an_internship_name"));
    if (!draft.company.trim()) issues.push(t(locale, "app.internships.add_the_company_name"));
    if (draft.endDate && draft.startDate && draft.endDate < draft.startDate) issues.push(t(locale, "app.internships.end_date_must_be_after_start_date"));
    if (issues.length) {
      await dialog.validation({ title: t(locale, "app.internships.details_to_complete"), details: issues, description: t(locale, "app.internships.the_internship_has_not_been_created_yet") });
      return;
    }
    addInternship({ ...draft, name: draft.name.trim(), company: draft.company.trim() });
    setDraft(emptyStage);
    setCreating(false);
    toast.success(t(locale, "app.internships.internship_created"));
  }

  async function removeStage(stage: Internship) {
    const accepted = await dialog.confirm({
      title: t(locale, "app.internships.delete_this_internship"),
      description: t(locale, "app.internships.delete_description", { name: stage.name }),
      tone: "danger",
      confirmLabel: t(locale, "app.internships.delete_permanently"),
      cancelLabel: t(locale, "app.internships.keep"),
    });
    if (!accepted) return;
    deleteInternship(stage.id);
    toast.success(t(locale, "app.internships.internship_deleted"));
  }

  const workModeOptions = [
    { value: "onsite", label: t(locale, "app.internships.on_site") },
    { value: "remote", label: t(locale, "app.internships.remote") },
    { value: "hybrid", label: t(locale, "app.internships.hybrid") },
  ];
  const statusOptions = [
    { value: "planned", label: t(locale, "app.internships.planned") },
    { value: "active", label: t(locale, "app.internships.active") },
    { value: "paused", label: t(locale, "app.internships.paused") },
    { value: "completed", label: t(locale, "app.internships.completed") },
  ];

  return (
    <>
      <PageHeader
        title={t(locale, "app.internships.my_internships")}
        description={t(locale, "app.internships.centralize_professional_context_contacts_hour_targets_and_school_details_for_eac")}
        actions={<Button onClick={() => setCreating((value) => !value)}><Plus className="size-4" />{t(locale, "app.internships.new_internship")}</Button>}
      />

      {creating ? (
        <Card className="mb-5 border-primary/25">
          <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.internships.create_a_complete_internship")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.internships.these_details_will_feed_reports_and_avoid_re_entering_them_later")}</p></div></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label={t(locale, "app.internships.internship_name")}><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t(locale, "app.internships.summer_internship_2027")} /></Field>
              <Field label={t(locale, "app.internships.company")}><Input value={draft.company} onChange={(event) => setDraft({ ...draft, company: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.role")}><Input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.department")}><Input value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.industry")}><Input value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.primary_location")}><Input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.work_mode")}><Select value={draft.workMode} onValueChange={(value) => setDraft({ ...draft, workMode: value as Internship["workMode"] })} options={workModeOptions} /></Field>
              <Field label={t(locale, "app.internships.status")}><Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as Internship["status"] })} options={statusOptions} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label={t(locale, "app.internships.supervisor")}><Input value={draft.supervisor} onChange={(event) => setDraft({ ...draft, supervisor: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.supervisor_email")}><Input type="email" value={draft.supervisorEmail} onChange={(event) => setDraft({ ...draft, supervisorEmail: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.supervisor_phone")}><Input type="tel" value={draft.supervisorPhone} onChange={(event) => setDraft({ ...draft, supervisorPhone: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.school")}><Input value={draft.school} onChange={(event) => setDraft({ ...draft, school: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.academic_supervisor")}><Input value={draft.teacher} onChange={(event) => setDraft({ ...draft, teacher: event.target.value })} /></Field>
              <Field label={t(locale, "app.internships.academic_email")}><Input type="email" value={draft.teacherEmail} onChange={(event) => setDraft({ ...draft, teacherEmail: event.target.value })} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label={t(locale, "app.internships.start_date")}><DatePicker value={draft.startDate} onChange={(value) => setDraft({ ...draft, startDate: value })} locale={locale} /></Field>
              <Field label={t(locale, "app.internships.end_date")}><DatePicker value={draft.endDate} onChange={(value) => setDraft({ ...draft, endDate: value })} locale={locale} min={draft.startDate || undefined} /></Field>
              <Field label={t(locale, "app.internships.total_target_h")}><Input type="number" min={1} value={draft.goalHours} onChange={(event) => setDraft({ ...draft, goalHours: Number(event.target.value) })} /></Field>
              <Field label={t(locale, "app.internships.weekly_target_h")}><Input type="number" min={1} value={draft.weeklyGoalHours} onChange={(event) => setDraft({ ...draft, weeklyGoalHours: Number(event.target.value) })} /></Field>
            </div>
            <Field label={t(locale, "app.internships.mandate_description")}><Textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={t(locale, "app.internships.responsibilities_team_products_goals_and_internship_context")} /></Field>
            <div className="flex flex-wrap gap-2"><Button onClick={() => void createStage()}>{t(locale, "app.internships.create_internship")}</Button><Button variant="secondary" onClick={() => setCreating(false)}>{t(locale, "app.internships.cancel")}</Button></div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {data.internships.map((stage) => {
          const active = stage.id === activeInternship.id;
          const hours = data.entries.filter((entry) => entry.internshipId === stage.id).reduce((total, entry) => total + entry.hours, 0);
          const progress = stage.goalHours ? Math.min(100, (hours / stage.goalHours) * 100) : 0;
          return (
            <Card key={stage.id} className={active ? "border-primary/35 ring-3 ring-primary/6" : undefined}>
              <CardHeader>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold">{stage.name}</h2>{active ? <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success"><Check className="size-3.5" />{t(locale, "app.internships.active_2")}</span> : null}<span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-strong">{statusOptions.find((option) => option.value === stage.status)?.label}</span></div><p className="mt-1 text-sm text-muted">{stage.company || (t(locale, "app.internships.company_not_set"))}</p></div>
                <BriefcaseBusiness className="size-5 shrink-0 text-primary" />
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-border bg-background p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-muted-strong">{hours.toFixed(1)} {t(locale, "common.misc.hour_short")} / {stage.goalHours} {t(locale, "common.misc.hour_short")}</span><span className="font-bold text-primary">{Math.round(progress)}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} /></div></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t(locale, "app.internships.name")}><Input value={stage.name} onChange={(event) => updateInternship(stage.id, { name: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.company")}><Input value={stage.company} onChange={(event) => updateInternship(stage.id, { company: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.role")}><Input value={stage.role} onChange={(event) => updateInternship(stage.id, { role: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.department")}><Input value={stage.department} onChange={(event) => updateInternship(stage.id, { department: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.work_mode")}><Select value={stage.workMode} onValueChange={(value) => updateInternship(stage.id, { workMode: value as Internship["workMode"] })} options={workModeOptions} /></Field>
                  <Field label={t(locale, "app.internships.status")}><Select value={stage.status} onValueChange={(value) => updateInternship(stage.id, { status: value as Internship["status"] })} options={statusOptions} /></Field>
                  <Field label={t(locale, "app.internships.supervisor")}><Input value={stage.supervisor} onChange={(event) => updateInternship(stage.id, { supervisor: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.supervisor_email")}><Input type="email" value={stage.supervisorEmail} onChange={(event) => updateInternship(stage.id, { supervisorEmail: event.target.value })} /></Field>
                  <Field label={t(locale, "app.internships.start")}><DatePicker value={stage.startDate} onChange={(value) => updateInternship(stage.id, { startDate: value })} locale={locale} /></Field>
                  <Field label={t(locale, "app.internships.end")}><DatePicker value={stage.endDate} onChange={(value) => updateInternship(stage.id, { endDate: value })} locale={locale} min={stage.startDate || undefined} /></Field>
                  <Field label={t(locale, "app.internships.total_target")}><Input type="number" min={1} value={stage.goalHours} onChange={(event) => updateInternship(stage.id, { goalHours: Number(event.target.value) })} /></Field>
                  <Field label={t(locale, "app.internships.weekly_target")}><Input type="number" min={1} value={stage.weeklyGoalHours} onChange={(event) => updateInternship(stage.id, { weeklyGoalHours: Number(event.target.value) })} /></Field>
                </div>
                <Field label={t(locale, "app.internships.mandate_description")}><Textarea rows={3} value={stage.description} onChange={(event) => updateInternship(stage.id, { description: event.target.value })} /><FieldHint>{t(locale, "app.internships.changes_in_this_card_are_saved_automatically")}</FieldHint></Field>
                <div className="flex flex-wrap justify-between gap-2"><Button variant={active ? "secondary" : "primary"} disabled={active} onClick={() => setActiveInternship(stage.id)}>{active ? (t(locale, "app.internships.active_internship")) : (t(locale, "app.internships.use_this_internship"))}</Button><Button variant="danger" disabled={data.internships.length <= 1} onClick={() => void removeStage(stage)}><Trash2 className="size-4" />{t(locale, "app.internships.delete")}</Button></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel>{children}</div>;
}
