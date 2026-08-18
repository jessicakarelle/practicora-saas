"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useState } from "react";
import { GripVertical, LayoutTemplate, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createReportTemplate, listReportTemplates, type OrganizationReportTemplate } from "@/lib/organization";
import { uid } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

type Section = { id: string; label: string; required: boolean; type: string };

export default function TemplatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const fr = locale !== "en";
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationReportTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("weekly");
  const [cadence, setCadence] = useState("weekly");
  const [sections, setSections] = useState<Section[]>([
    { id: uid("section"), label: t(locale, "organization.templates.period_summary"), required: true, type: "long_text" },
    { id: uid("section"), label: t(locale, "organization.templates.key_achievements"), required: true, type: "long_text" },
    { id: uid("section"), label: t(locale, "organization.templates.challenges_and_solutions"), required: false, type: "long_text" },
    { id: uid("section"), label: t(locale, "organization.templates.next_goals"), required: true, type: "long_text" },
  ]);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setItems(await listReportTemplates(organizationId));
    setLoading(false);
  }, [organizationId]);
  useEffect(() => { void load(); }, [load]);

  function addSection() { setSections((current) => [...current, { id: uid("section"), label: "", required: false, type: "long_text" }]); }
  function updateSection(id: string, patch: Partial<Section>) { setSections((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)); }
  function removeSection(id: string) { setSections((current) => current.filter((item) => item.id !== id)); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !name.trim() || !sections.some((section) => section.label.trim())) {
      toast.error(t(locale, "organization.templates.add_a_name_and_at_least_one_section")); return;
    }
    setSaving(true);
    const result = await createReportTemplate(organizationId, { name: name.trim(), description, reportType, cadence, sections: sections.filter((section) => section.label.trim()) });
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(t(locale, "organization.templates.template_created")); setOpen(false); setName(""); setDescription(""); await load();
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.templates.report_templates")} description={t(locale, "organization.templates.build_sections_criteria_and_cadences_once_then_apply_them_automatically_to_cohor")} actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />{t(locale, "organization.templates.new_template")}</Button>} />
    {loading ? <div className="h-56 animate-pulse rounded-2xl bg-surface-muted" /> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.id}><CardContent>
      <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><LayoutTemplate className="size-5" /></span><StatusBadge status={item.status} locale={locale} /></div>
      <h2 className="mt-4 text-lg font-extrabold">{item.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-muted">{item.description || (t(locale, "organization.templates.no_description"))}</p>
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold text-muted-strong">{item.reportType}</span><span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold text-muted-strong">{item.cadence}</span><span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold text-muted-strong">{item.sections.length} {fr ? "sections" : "sections"}</span></div>
      <div className="mt-4 space-y-2">{item.sections.slice(0, 4).map((section) => <div key={section.id} className="flex items-center gap-2 text-sm"><span className={`size-1.5 rounded-full ${section.required ? "bg-primary" : "bg-border-strong"}`} /><span className="truncate">{section.label}</span></div>)}</div>
    </CardContent></Card>)}</div> : <EmptyState icon={LayoutTemplate} title={t(locale, "organization.templates.no_templates")} description={t(locale, "organization.templates.create_a_weekly_final_evaluation_or_portfolio_template")} action={<Button onClick={() => setOpen(true)}>{t(locale, "organization.templates.create_template")}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} size="xl" title={t(locale, "organization.templates.create_report_template")} description={t(locale, "organization.templates.student_forms_will_be_generated_automatically_from_this_structure")} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t(locale, "organization.templates.cancel")}</Button><Button form="template-form" type="submit" disabled={saving}>{saving ? (t(locale, "organization.templates.creating")) : (t(locale, "organization.templates.create_template_2"))}</Button></>}>
      <form id="template-form" className="space-y-5" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "organization.templates.template_name")}</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(locale, "organization.templates.weekly_co_op_report")} /></div><div><FieldLabel>{t(locale, "organization.templates.report_type")}</FieldLabel><Select value={reportType} onValueChange={setReportType} options={[{ value: "weekly", label: t(locale, "organization.templates.weekly") }, { value: "monthly", label: t(locale, "organization.templates.monthly") }, { value: "final", label: t(locale, "organization.templates.final") }, { value: "evaluation", label: t(locale, "organization.templates.evaluation") }, { value: "portfolio", label: t(locale, "organization.templates.evidence_portfolio") }]} /></div></div>
        <div><FieldLabel>{t(locale, "organization.templates.description")}</FieldLabel><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="max-w-sm"><FieldLabel>{t(locale, "organization.templates.cadence")}</FieldLabel><Select value={cadence} onValueChange={setCadence} options={[{ value: "daily", label: t(locale, "organization.templates.daily") }, { value: "weekly", label: t(locale, "organization.templates.weekly") }, { value: "biweekly", label: t(locale, "organization.templates.biweekly") }, { value: "monthly", label: t(locale, "organization.templates.monthly_2") }, { value: "once", label: t(locale, "organization.templates.once") }]} /></div>
        <div><div className="flex items-end justify-between gap-4"><div><FieldLabel>{t(locale, "organization.templates.form_sections")}</FieldLabel><FieldHint>{t(locale, "organization.templates.add_only_useful_fields_responses_are_saved_automatically")}</FieldHint></div><Button type="button" variant="secondary" size="sm" onClick={addSection}><Plus className="size-4" />{t(locale, "organization.templates.section")}</Button></div>
          <div className="mt-3 space-y-3">{sections.map((section, index) => <div key={section.id} className="grid gap-3 rounded-2xl border border-border bg-background p-3 sm:grid-cols-[28px_1fr_180px_140px_36px] sm:items-center"><GripVertical className="hidden size-4 text-muted sm:block" /><Input value={section.label} onChange={(e) => updateSection(section.id, { label: e.target.value })} placeholder={`${t(locale, "organization.templates.section")} ${index + 1}`} /><Select value={section.type} onValueChange={(type) => updateSection(section.id, { type })} options={[{ value: "short_text", label: t(locale, "organization.templates.short_text") }, { value: "long_text", label: t(locale, "organization.templates.long_text") }, { value: "rating", label: t(locale, "organization.templates.rating") }, { value: "checklist", label: t(locale, "organization.templates.checklist") }, { value: "evidence", label: t(locale, "organization.templates.evidence_or_link") }]} /><div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2"><span className="text-xs font-bold">{t(locale, "organization.templates.required")}</span><Switch checked={section.required} onCheckedChange={(required) => updateSection(section.id, { required })} /></div><button type="button" onClick={() => removeSection(section.id)} className="flex size-9 items-center justify-center rounded-xl text-muted hover:bg-danger/8 hover:text-danger" aria-label={t(locale, "organization.templates.delete")}><Trash2 className="size-4" /></button></div>)}</div>
        </div>
      </form>
    </Modal>
  </OrganizationRequired>;
}
