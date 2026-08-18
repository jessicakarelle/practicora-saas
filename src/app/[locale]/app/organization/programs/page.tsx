"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useState } from "react";
import { BookOpenCheck, Clock3, Plus, School } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createProgram, listPrograms, type OrganizationProgram } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function ProgramsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationProgram[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", requiredHours: 240 });

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setItems(await listPrograms(organizationId));
    setLoading(false);
  }, [organizationId]);
  useEffect(() => { void load(); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !form.name.trim()) return;
    setSaving(true);
    const result = await createProgram(organizationId, form);
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(t(locale, "organization.programs.program_created"));
    setOpen(false);
    setForm({ name: "", code: "", description: "", requiredHours: 240 });
    await load();
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.programs.programs")} description={t(locale, "organization.programs.define_shared_requirements_minimum_hours_and_the_tracking_structure_for_cohorts")} actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" />{t(locale, "organization.programs.new_program")}</Button>} />
    {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-surface-muted" /><div className="h-48 animate-pulse rounded-2xl bg-surface-muted" /></div> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((program) => <Card key={program.id}><CardContent>
      <div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><School className="size-5" /></span><StatusBadge status={program.status} locale={locale} /></div>
      <h2 className="mt-4 text-lg font-extrabold">{program.name}</h2><p className="mt-1 text-xs font-bold uppercase tracking-[.1em] text-muted">{program.code || (t(locale, "organization.programs.no_code"))}</p>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted">{program.description || (t(locale, "organization.programs.no_description"))}</p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm font-bold"><Clock3 className="size-4 text-primary" />{program.requiredHours} {t(locale, "organization.programs.required_hours")}</div>
    </CardContent></Card>)}</div> : <EmptyState icon={BookOpenCheck} title={t(locale, "organization.programs.no_programs")} description={t(locale, "organization.programs.create_the_first_program_to_define_requirements_and_attach_cohorts")} action={<Button onClick={() => setOpen(true)}>{t(locale, "organization.programs.create_program")}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={t(locale, "organization.programs.new_program")} description={t(locale, "organization.programs.these_settings_can_later_be_reused_across_multiple_cohorts")} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>{t(locale, "organization.programs.cancel")}</Button><Button form="program-form" type="submit" disabled={saving}>{saving ? (t(locale, "organization.programs.creating")) : (t(locale, "organization.programs.create"))}</Button></>}>
      <form id="program-form" className="space-y-4" onSubmit={submit}>
        <div><FieldLabel>{t(locale, "organization.programs.program_name")}</FieldLabel><Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder={t(locale, "organization.programs.computer_science_technology")} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "organization.programs.code")}</FieldLabel><Input value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} placeholder={t(locale, "organization.programs.program_code_placeholder")} /></div><div><FieldLabel>{t(locale, "organization.programs.required_hours_2")}</FieldLabel><Input type="number" min={1} value={form.requiredHours} onChange={(e) => setForm((v) => ({ ...v, requiredHours: Number(e.target.value) }))} /></div></div>
        <div><FieldLabel>{t(locale, "organization.programs.description")}</FieldLabel><Textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder={t(locale, "organization.programs.goals_requirements_and_program_context")} /></div>
      </form>
    </Modal>
  </OrganizationRequired>;
}
