"use client";

import { translate as t } from "@/i18n";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FolderKanban,
  Link2,
  MapPin,
  Paperclip,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AttachmentManager } from "@/components/journal/attachment-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldError, FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SuggestionInput } from "@/components/ui/suggestion-input";
import { TimePicker } from "@/components/ui/time-picker";
import { clearJournalDraft, loadJournalDraft, saveJournalDraft } from "@/lib/journal-drafts";
import { useStageLog } from "@/lib/store";
import type { JournalEntry } from "@/lib/types";
import { calculateHours, toDateInputValue, uid } from "@/lib/utils";

function createTodoSchema(locale: string) {
  return z.object({
    id: z.string(),
    text: z.string().trim().min(1, t(locale, "common.misc.task_empty")),
    done: z.boolean(),
    priority: z.enum(["low", "medium", "high"]),
    type: z.enum(["development", "communication", "research", "meeting", "admin", "other"]),
  });
}

const evidenceSchema = z.object({
  id: z.string(),
  label: z.string().trim(),
  url: z.string().trim(),
});

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number().min(0),
  kind: z.enum(["image", "document"]),
  createdAt: z.string(),
});

function createEntrySchema(locale: string) {
  return z.object({
    date: z.string().min(1, t(locale, "common.misc.date_required")),
    start: z.string().min(1, t(locale, "common.misc.start_time_required")),
    end: z.string().min(1, t(locale, "common.misc.end_time_required")),
    breakMinutes: z.coerce.number().min(0).max(480),
    location: z.string().trim(),
    workMode: z.enum(["onsite", "remote", "hybrid"]),
    project: z.string().trim(),
    category: z.enum(["development", "design", "analysis", "testing", "support", "meeting", "learning", "administration", "other"]),
    workDone: z.string().trim().min(10, t(locale, "common.misc.minimum_10_characters")),
    achievements: z.string().trim(),
    learned: z.string().trim(),
    difficulties: z.string().trim(),
    blockers: z.string().trim(),
    feedback: z.string().trim(),
    nextSteps: z.string().trim(),
    notes: z.string().trim(),
    mood: z.coerce.number().min(1).max(5),
    energy: z.coerce.number().min(1).max(5),
    focus: z.coerce.number().min(1).max(5),
    satisfaction: z.coerce.number().min(1).max(5),
    tagsText: z.string(),
    todos: z.array(createTodoSchema(locale)),
    evidenceLinks: z.array(evidenceSchema),
    attachments: z.array(attachmentSchema),
  });
}

type EntrySchema = ReturnType<typeof createEntrySchema>;
type EntryFormInput = z.input<EntrySchema>;
type EntryFormValues = z.output<EntrySchema>;

export function JournalEntryForm({
  locale,
  entry,
  draftId = "new",
}: {
  locale: string;
  entry?: JournalEntry;
  draftId?: string;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const { activeInternship, activeEntries, addEntry, updateEntry } = useStageLog();
  const [draftStatus, setDraftStatus] = useState<"saving" | "saved">("saved");
  const hydratedDraft = useRef(false);
  const lastAutoSaved = useRef("");

  const entrySchema = useMemo(() => createEntrySchema(locale), [locale]);
  const mostRecentEntry = useMemo(
    () => [...activeEntries].sort((left, right) => right.date.localeCompare(left.date) || right.updatedAt.localeCompare(left.updatedAt))[0],
    [activeEntries],
  );
  const locationSuggestions = useMemo(
    () => [activeInternship.location, ...activeEntries.map((item) => item.location)],
    [activeEntries, activeInternship.location],
  );
  const projectSuggestions = useMemo(
    () => activeEntries.map((item) => item.project),
    [activeEntries],
  );

  const defaultValues = useMemo<EntryFormInput>(() => ({
    date: entry?.date || toDateInputValue(),
    start: entry?.start || "09:00",
    end: entry?.end || "17:00",
    breakMinutes: entry?.breakMinutes ?? 60,
    location: entry?.location || activeInternship.location || "",
    workMode: entry?.workMode || activeInternship.workMode || "onsite",
    project: entry?.project || "",
    category: entry?.category || "development",
    workDone: entry?.workDone || "",
    achievements: entry?.achievements || "",
    learned: entry?.learned || "",
    difficulties: entry?.difficulties || "",
    blockers: entry?.blockers || "",
    feedback: entry?.feedback || "",
    nextSteps: entry?.nextSteps || "",
    notes: entry?.notes || "",
    mood: entry?.mood || 3,
    energy: entry?.energy || 3,
    focus: entry?.focus || 3,
    satisfaction: entry?.satisfaction || 3,
    tagsText: entry?.tags.join(", ") || "",
    todos: entry?.todos || [],
    evidenceLinks: entry?.evidenceLinks || [],
    attachments: entry?.attachments || [],
  }), [activeInternship.location, activeInternship.workMode, entry]);

  const form = useForm<EntryFormInput, unknown, EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues,
    mode: "onBlur",
  });
  const todos = useFieldArray({ control: form.control, name: "todos" });
  const evidenceLinks = useFieldArray({ control: form.control, name: "evidenceLinks" });
  const [start, end, breakMinutes] = useWatch({
    control: form.control,
    name: ["start", "end", "breakMinutes"],
  });
  const calculatedHours = calculateHours(start, end, Number(breakMinutes || 0));
  const draftValue = useWatch({ control: form.control });

  useEffect(() => {
    if (hydratedDraft.current) return;
    hydratedDraft.current = true;
    if (entry) return;
    const draft = loadJournalDraft(draftId);
    if (draft) form.reset({ ...defaultValues, ...draft.values } as EntryFormInput);
  }, [defaultValues, draftId, entry, form]);

  useEffect(() => {
    if (entry) return;
    const timer = window.setTimeout(() => {
      setDraftStatus("saving");
      saveJournalDraft(draftId, draftValue as Record<string, unknown>);
      setDraftStatus("saved");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [draftId, draftValue, entry]);

  useEffect(() => {
    if (!entry) return;
    const timer = window.setTimeout(() => {
      const parsed = entrySchema.safeParse(draftValue);
      if (!parsed.success) return;
      const signature = JSON.stringify(parsed.data);
      if (signature === lastAutoSaved.current) return;
      lastAutoSaved.current = signature;
      updateEntry(entry.id, toPayload(parsed.data, activeInternship.id));
      setDraftStatus("saved");
    }, 650);
    return () => window.clearTimeout(timer);
  }, [activeInternship.id, draftValue, entry, entrySchema, updateEntry]);

  async function showValidation(errors: typeof form.formState.errors) {
    const details = Object.values(errors)
      .flatMap((error) => {
        if (!error) return [];
        if ("message" in error && typeof error.message === "string") return [error.message];
        return [];
      })
      .slice(0, 6);
    await dialog.validation({
      title: t(locale, "common.misc.the_entry_is_incomplete"),
      description: t(locale, "common.misc.correct_the_following_items_your_draft_remains_saved_automatically"),
      details: details.length ? details : [t(locale, "common.misc.check_required_fields")],
      confirmLabel: t(locale, "common.misc.review_form"),
    });
  }

  const submit = form.handleSubmit(
    (values) => {
      if (entry) return;
      addEntry(toPayload(values, activeInternship.id));
      clearJournalDraft(draftId);
      toast.success(t(locale, "common.misc.the_day_was_added_to_the_journal"));
      router.push(`/${locale}/app/journal/history`);
    },
    (errors) => void showValidation(errors),
  );

  function reuseRecentContext() {
    if (!mostRecentEntry) return;
    form.setValue("location", mostRecentEntry.location, { shouldDirty: true });
    form.setValue("workMode", mostRecentEntry.workMode, { shouldDirty: true });
    form.setValue("project", mostRecentEntry.project, { shouldDirty: true });
    form.setValue("category", mostRecentEntry.category, { shouldDirty: true });
    form.setValue("start", mostRecentEntry.start, { shouldDirty: true });
    form.setValue("end", mostRecentEntry.end, { shouldDirty: true });
    form.setValue("breakMinutes", mostRecentEntry.breakMinutes, { shouldDirty: true });
    toast.success(t(locale, "app.journal.previous_context_reused"));
  }

  const priorityOptions = [
    { value: "low", label: t(locale, "common.misc.low_priority") },
    { value: "medium", label: t(locale, "common.misc.medium_priority") },
    { value: "high", label: t(locale, "common.misc.high_priority") },
  ];
  const typeOptions = [
    { value: "development", label: t(locale, "common.misc.development") },
    { value: "communication", label: t(locale, "common.misc.communication") },
    { value: "research", label: t(locale, "common.misc.research") },
    { value: "meeting", label: t(locale, "common.misc.meeting") },
    { value: "admin", label: t(locale, "common.misc.administration") },
    { value: "other", label: t(locale, "common.misc.other") },
  ];
  const ratingOptions = [1, 2, 3, 4, 5].map((value) => ({
    value: String(value),
    label: `${value}/5 — ${t(locale, `common.misc.rating_${value}`)}`,
  }));

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Card>
        <CardHeader>
          <div>
            <h2 className="text-lg font-bold">{t(locale, "common.misc.day_context")}</h2>
            <p className="mt-1 text-sm text-muted">{t(locale, "common.misc.operational_details_improve_filters_reports_and_analytics")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {mostRecentEntry && !entry ? (
              <Button type="button" variant="ghost" size="sm" onClick={reuseRecentContext}>
                <RotateCcw className="size-4" />{t(locale, "app.journal.reuse_last_context")}
              </Button>
            ) : null}
            <AutosaveBadge status={draftStatus} locale={locale} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field name="date" label={t(locale, "common.misc.date")} error={form.formState.errors.date?.message}>
              <Controller control={form.control} name="date" render={({ field }) => <DatePicker id="date" value={field.value} onChange={field.onChange} locale={locale} allowClear={false} />} />
            </Field>
            <Field name="start" label={t(locale, "common.misc.start")} error={form.formState.errors.start?.message}>
              <Controller control={form.control} name="start" render={({ field }) => <TimePicker id="start" value={field.value} onChange={field.onChange} locale={locale} />} />
            </Field>
            <Field name="end" label={t(locale, "common.misc.end")} error={form.formState.errors.end?.message}>
              <Controller control={form.control} name="end" render={({ field }) => <TimePicker id="end" value={field.value} onChange={field.onChange} locale={locale} />} />
            </Field>
            <Field name="breakMinutes" label={t(locale, "common.misc.break_minutes")} error={form.formState.errors.breakMinutes?.message}>
              <Input id="breakMinutes" type="number" min={0} max={480} {...form.register("breakMinutes")} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field name="workMode" label={t(locale, "common.misc.work_mode")}>
              <Controller control={form.control} name="workMode" render={({ field }) => <Select id="workMode" value={field.value} onValueChange={field.onChange} options={[{ value: "onsite", label: t(locale, "common.misc.on_site") }, { value: "remote", label: t(locale, "common.misc.remote") }, { value: "hybrid", label: t(locale, "common.misc.hybrid") }]} />} />
            </Field>
            <Field name="category" label={t(locale, "common.misc.main_category")}>
              <Controller control={form.control} name="category" render={({ field }) => <Select id="category" value={field.value} onValueChange={field.onChange} options={[{ value: "development", label: t(locale, "common.misc.development") }, { value: "design", label: t(locale, "common.misc.design") }, { value: "analysis", label: t(locale, "common.misc.analysis") }, { value: "testing", label: t(locale, "common.misc.testing_and_qa") }, { value: "support", label: t(locale, "common.misc.support") }, { value: "meeting", label: t(locale, "common.misc.meeting") }, { value: "learning", label: t(locale, "common.misc.learning") }, { value: "administration", label: t(locale, "common.misc.administration") }, { value: "other", label: t(locale, "common.misc.other") }]} />} />
            </Field>
            <Field name="project" label={t(locale, "common.misc.project_or_workstream")}>
              <Controller control={form.control} name="project" render={({ field }) => <SuggestionInput value={field.value} onChange={field.onChange} suggestions={projectSuggestions} startIcon={<FolderKanban className="size-4" />} recentLabel={t(locale, "app.journal.recent_values")} placeholder={t(locale, "common.misc.e_g_client_portal_redesign")} />} />
            </Field>
            <Field name="location" label={t(locale, "common.misc.location")}>
              <Controller control={form.control} name="location" render={({ field }) => <SuggestionInput value={field.value} onChange={field.onChange} suggestions={locationSuggestions} startIcon={<MapPin className="size-4" />} recentLabel={t(locale, "app.journal.recent_values")} placeholder={t(locale, "common.misc.office_home_client")} />} />
            </Field>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-primary/15 bg-primary-softer/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-strong">{t(locale, "common.misc.calculated_duration")}</span>
            <strong className="text-lg font-extrabold tabular-nums text-primary">{calculatedHours.toFixed(2)} {t(locale, "common.misc.hours")}</strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "common.misc.professional_summary")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.write_for_your_future_self_your_supervisor_and_your_reports")}</p></div></CardHeader>
        <CardContent className="space-y-5">
          <Field name="workDone" label={t(locale, "common.misc.work_completed")} error={form.formState.errors.workDone?.message}>
            <Textarea id="workDone" rows={6} placeholder={t(locale, "common.misc.describe_responsibilities_decisions_and_outcomes")} {...form.register("workDone")} />
          </Field>
          <div className="grid gap-5 lg:grid-cols-2">
            <Field name="achievements" label={t(locale, "common.misc.outcomes_and_achievements")}><Textarea id="achievements" placeholder={t(locale, "common.misc.completed_deliverables_measurable_improvement_avoided_issue")} {...form.register("achievements")} /></Field>
            <Field name="learned" label={t(locale, "common.misc.what_i_learned")}><Textarea id="learned" placeholder={t(locale, "common.misc.new_concepts_tools_methods_or_skills")} {...form.register("learned")} /></Field>
            <Field name="difficulties" label={t(locale, "common.misc.challenges_and_solutions")}><Textarea id="difficulties" placeholder={t(locale, "common.misc.explain_the_issue_and_how_you_moved_forward")} {...form.register("difficulties")} /></Field>
            <Field name="blockers" label={t(locale, "common.misc.blockers_or_dependencies")}><Textarea id="blockers" placeholder={t(locale, "common.misc.missing_access_pending_decision_external_dependency")} {...form.register("blockers")} /></Field>
            <Field name="feedback" label={t(locale, "common.misc.feedback_received")}><Textarea id="feedback" placeholder={t(locale, "common.misc.comments_from_your_supervisor_team_or_client")} {...form.register("feedback")} /></Field>
            <Field name="nextSteps" label={t(locale, "common.misc.next_steps")}><Textarea id="nextSteps" placeholder={t(locale, "common.misc.what_should_be_continued_checked_or_prepared_next")} {...form.register("nextSteps")} /></Field>
          </div>
          <Field name="notes" label={t(locale, "common.misc.private_notes")}><Textarea id="notes" placeholder={t(locale, "common.misc.additional_context_useful_for_your_personal_follow_up")} {...form.register("notes")} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-bold">{t(locale, "common.misc.daily_tasks")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.add_priority_and_type_to_produce_more_useful_statistics")}</p></div>
            <Button type="button" variant="secondary" size="sm" onClick={() => todos.append({ id: uid("todo"), text: "", done: false, priority: "medium", type: "development" })}><Plus className="size-4" />{t(locale, "common.misc.add_task")}</Button>
          </div>
          <div className="mt-5 space-y-3">
            {todos.fields.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-8 text-center text-sm text-muted">{t(locale, "common.misc.no_tasks_added")}</div> : null}
            {todos.fields.map((todoField, index) => (
              <div key={todoField.id} className="grid gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-[auto_minmax(0,1fr)_180px_190px_auto] md:items-start">
                <input type="checkbox" className="mt-3 size-4 accent-[var(--primary)]" {...form.register(`todos.${index}.done`)} aria-label={t(locale, "common.misc.task_completed")} />
                <div><Input id={`todo-${index}-text`} placeholder={t(locale, "common.misc.e_g_fix_responsive_form")} {...form.register(`todos.${index}.text`)} /><FieldError>{form.formState.errors.todos?.[index]?.text?.message}</FieldError></div>
                <Controller control={form.control} name={`todos.${index}.priority`} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} options={priorityOptions} />} />
                <Controller control={form.control} name={`todos.${index}.type`} render={({ field }) => <Select value={field.value} onValueChange={field.onChange} options={typeOptions} />} />
                <Button type="button" variant="ghost" size="sm" onClick={() => todos.remove(index)} aria-label={t(locale, "common.misc.delete_task")}><Trash2 className="size-4 text-danger" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "common.misc.energy_focus_and_skills")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.these_indicators_are_only_used_to_observe_trends_over_time")}</p></div></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(["mood", "energy", "focus", "satisfaction"] as const).map((name) => {
              const labels = { mood: t(locale, "common.misc.mood"), energy: t(locale, "common.misc.energy"), focus: t(locale, "common.misc.focus"), satisfaction: t(locale, "common.misc.satisfaction") };
              return <Field key={name} name={name} label={labels[name]}><Controller control={form.control} name={name} render={({ field }) => <Select id={name} value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))} options={ratingOptions} />} /></Field>;
            })}
          </div>
          <Field name="tagsText" label={t(locale, "common.misc.skills_and_technologies")}><Input id="tagsText" placeholder={t(locale, "common.misc.skills_placeholder")} {...form.register("tagsText")} /><FieldHint>{t(locale, "common.misc.separate_items_with_commas")}</FieldHint></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div><h2 className="flex items-center gap-2 text-lg font-bold"><Link2 className="size-5 text-primary" />{t(locale, "common.misc.evidence_and_references")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "common.misc.only_add_links_authorized_by_your_employer_without_confidential_information")}</p></div>
          <Button type="button" variant="secondary" size="sm" onClick={() => evidenceLinks.append({ id: uid("evidence"), label: "", url: "" })}><Plus className="size-4" />{t(locale, "common.misc.add_link")}</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {evidenceLinks.fields.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-7 text-center text-sm text-muted">{t(locale, "common.misc.no_reference_added")}</div> : null}
          {evidenceLinks.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)_auto]"><Input placeholder={t(locale, "common.misc.deliverable_name")} {...form.register(`evidenceLinks.${index}.label`)} /><Input type="url" placeholder={t(locale, "common.misc.url_placeholder")} {...form.register(`evidenceLinks.${index}.url`)} /><Button type="button" variant="ghost" onClick={() => evidenceLinks.remove(index)} aria-label={t(locale, "common.misc.delete_link")}><Trash2 className="size-4 text-danger" /></Button></div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><h2 className="flex items-center gap-2 text-lg font-bold"><Paperclip className="size-5 text-primary" />{t(locale, "app.journal.files_and_gallery")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.journal.files_and_gallery_description")}</p></div></CardHeader>
        <CardContent>
          <Controller control={form.control} name="attachments" render={({ field }) => <AttachmentManager locale={locale} value={field.value} onChange={field.onChange} />} />
        </CardContent>
      </Card>

      <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-surface/94 p-3 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className={`size-4 ${draftStatus === "saved" ? "text-success" : "text-warning"}`} /><span>{draftStatus === "saved" ? (entry ? t(locale, "common.misc.all_changes_are_saved_automatically") : t(locale, "common.misc.draft_saved_automatically")) : t(locale, "common.misc.saving_draft")}</span></div>
        {!entry ? <Button type="submit" size="lg"><Sparkles className="size-4" />{t(locale, "app.journal.publish_to_journal")}</Button> : <Button type="button" variant="secondary" onClick={() => router.push(`/${locale}/app/journal/history`)}>{t(locale, "common.misc.done")}</Button>}
      </div>
    </form>
  );
}

function toPayload(values: EntryFormValues, internshipId: string): Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> {
  return {
    internshipId,
    date: values.date,
    start: values.start,
    end: values.end,
    breakMinutes: values.breakMinutes,
    hours: calculateHours(values.start, values.end, values.breakMinutes),
    location: values.location,
    workMode: values.workMode,
    project: values.project,
    category: values.category,
    workDone: values.workDone,
    achievements: values.achievements,
    learned: values.learned,
    difficulties: values.difficulties,
    blockers: values.blockers,
    feedback: values.feedback,
    nextSteps: values.nextSteps,
    notes: values.notes,
    mood: values.mood as 1 | 2 | 3 | 4 | 5,
    energy: values.energy as 1 | 2 | 3 | 4 | 5,
    focus: values.focus as 1 | 2 | 3 | 4 | 5,
    satisfaction: values.satisfaction as 1 | 2 | 3 | 4 | 5,
    todos: values.todos,
    tags: values.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
    evidenceLinks: values.evidenceLinks.filter((link) => link.label || link.url),
    attachments: values.attachments,
  };
}

function Field({ name, label, error, children }: { name: string; label: string; error?: React.ReactNode; children: React.ReactNode }) {
  return <div><FieldLabel htmlFor={name}>{label}</FieldLabel>{children}<FieldError>{error}</FieldError></div>;
}

function AutosaveBadge({ status, locale }: { status: "saving" | "saved"; locale: string }) {
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status === "saved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}><span className={`size-1.5 rounded-full ${status === "saved" ? "bg-success" : "bg-warning"}`} />{status === "saved" ? t(locale, "common.misc.draft_up_to_date") : t(locale, "common.misc.saving")}</span>;
}
