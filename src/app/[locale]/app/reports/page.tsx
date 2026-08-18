"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ClipboardCheck,
  FileJson,
  FileSpreadsheet,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Printer,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FilterPanel } from "@/components/ui/filter-panel";
import {
  submitInstitutionalReport,
  type SubmitInstitutionalReportInput,
} from "@/lib/organization";
import { usePracticora } from "@/lib/store";
import type { JournalCategory, JournalEntry, WorkMode } from "@/lib/types";
import { downloadText, formatHours } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";

type ReportType = "weekly" | "monthly" | "final" | "portfolio";
type DetailLevel = "concise" | "standard" | "complete";
type ReportSections = {
  summary: boolean;
  analytics: boolean;
  objectives: boolean;
  skills: boolean;
  dailyJournal: boolean;
  evidence: boolean;
  reflection: boolean;
};
type ReportDraft = {
  reportType: ReportType;
  detailLevel: DetailLevel;
  title: string;
  introduction: string;
  reflection: string;
  conclusion: string;
  from: string;
  to: string;
  category: "all" | JournalCategory;
  workMode: "all" | WorkMode;
  query: string;
  sections: ReportSections;
};

const CATEGORY_COLORS: Record<JournalCategory, string> = {
  development: "#2f6f9f",
  design: "#6f5aa8",
  analysis: "#4f7c8e",
  testing: "#b46b3c",
  support: "#2f7d5b",
  meeting: "#a96b1d",
  learning: "#6759a6",
  administration: "#677482",
  other: "#8b6f47",
};

function draftKey(internshipId: string, workspaceId: string) {
  return `practicora:report-studio:${workspaceId}:${internshipId}`;
}

function defaultDraft(locale: string, internshipName: string, from: string, to: string): ReportDraft {
  return {
    reportType: "final",
    detailLevel: "standard",
    title: t(locale, "app.reports.professional_report_title", { name: internshipName }),
    introduction: "",
    reflection: "",
    conclusion: "",
    from,
    to,
    category: "all",
    workMode: "all",
    query: "",
    sections: {
      summary: true,
      analytics: true,
      objectives: true,
      skills: true,
      dailyJournal: true,
      evidence: true,
      reflection: true,
    },
  };
}

export default function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useDialog();
  const { activeWorkspace } = useWorkspace();
  const { data, activeEntries, activeInternship, activeObjectives, importLegacy } = usePracticora();

  const sortedEntries = useMemo(
    () => [...activeEntries].sort((a, b) => a.date.localeCompare(b.date)),
    [activeEntries],
  );
  const firstEntryDate = sortedEntries[0]?.date || activeInternship.startDate || "";
  const lastEntryDate = sortedEntries.at(-1)?.date || activeInternship.endDate || "";
  const workspaceId = activeWorkspace?.id || "personal";
  const [draft, setDraft] = useState<ReportDraft>(() =>
    defaultDraft(locale, activeInternship.name, firstEntryDate, lastEntryDate),
  );
  const [draftReady, setDraftReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const defaults = defaultDraft(locale, activeInternship.name, firstEntryDate, lastEntryDate);
      try {
        const stored = localStorage.getItem(draftKey(activeInternship.id, workspaceId));
        if (!stored) {
          setDraft(defaults);
        } else {
          const parsed = JSON.parse(stored) as Partial<ReportDraft>;
          setDraft({
            ...defaults,
            ...parsed,
            sections: { ...defaults.sections, ...(parsed.sections || {}) },
          });
        }
      } catch {
        setDraft(defaults);
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeInternship.id, activeInternship.name, firstEntryDate, lastEntryDate, locale, workspaceId]);

  useEffect(() => {
    if (!draftReady) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey(activeInternship.id, workspaceId), JSON.stringify(draft));
    }, 320);
    return () => window.clearTimeout(timer);
  }, [activeInternship.id, draft, draftReady, workspaceId]);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = draft.query.trim().toLowerCase();
    return sortedEntries.filter((entry) => {
      if (draft.from && entry.date < draft.from) return false;
      if (draft.to && entry.date > draft.to) return false;
      if (draft.category !== "all" && entry.category !== draft.category) return false;
      if (draft.workMode !== "all" && entry.workMode !== draft.workMode) return false;
      if (!normalizedQuery) return true;
      return [
        entry.project,
        entry.workDone,
        entry.achievements,
        entry.learned,
        entry.difficulties,
        entry.feedback,
        entry.notes,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [draft.category, draft.from, draft.query, draft.to, draft.workMode, sortedEntries]);

  const detailLimit = draft.detailLevel === "concise" ? 10 : draft.detailLevel === "standard" ? 25 : filteredEntries.length;
  const detailedEntries = filteredEntries.slice(0, detailLimit);
  const omittedEntryCount = Math.max(0, filteredEntries.length - detailedEntries.length);

  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const taskCount = filteredEntries.flatMap((entry) => entry.todos).length;
  const completedTasks = filteredEntries.flatMap((entry) => entry.todos).filter((todo) => todo.done).length;
  const skills = [...new Set(filteredEntries.flatMap((entry) => entry.tags))].sort();
  const evidence = filteredEntries.flatMap((entry) =>
    entry.evidenceLinks.map((link) => ({ ...link, entryDate: entry.date })),
  );
  const averageMood = filteredEntries.length
    ? filteredEntries.reduce((sum, entry) => sum + entry.mood, 0) / filteredEntries.length
    : 0;
  const objectives = activeObjectives.filter((objective) => {
    if (!draft.from && !draft.to) return true;
    if (!objective.deadline) return true;
    return (!draft.from || objective.deadline >= draft.from) && (!draft.to || objective.deadline <= draft.to);
  });

  const categoryLabels = useMemo<Record<JournalCategory, string>>(
    () => ({
      development: t(locale, "app.reports.development"),
      design: t(locale, "app.reports.design"),
      analysis: t(locale, "app.reports.analysis"),
      testing: t(locale, "app.reports.testing_and_qa"),
      support: t(locale, "app.reports.support"),
      meeting: t(locale, "app.reports.meeting"),
      learning: t(locale, "app.reports.learning"),
      administration: t(locale, "app.reports.administration"),
      other: t(locale, "app.reports.other"),
    }),
    [locale],
  );

  const categoryData = useMemo(() => {
    const values = new Map<JournalCategory, number>();
    filteredEntries.forEach((entry) => values.set(entry.category, (values.get(entry.category) || 0) + entry.hours));
    return Array.from(values, ([key, hours]) => ({ key, name: categoryLabels[key], hours }));
  }, [categoryLabels, filteredEntries]);

  const weeklyData = useMemo(() => {
    const values = new Map<string, { week: string; hours: number; tasks: number }>();
    filteredEntries.forEach((entry) => {
      const date = new Date(`${entry.date}T12:00:00`);
      const monday = new Date(date);
      const day = (date.getDay() + 6) % 7;
      monday.setDate(date.getDate() - day);
      const key = monday.toISOString().slice(0, 10);
      const current = values.get(key) || { week: key, hours: 0, tasks: 0 };
      current.hours += entry.hours;
      current.tasks += entry.todos.filter((todo) => todo.done).length;
      values.set(key, current);
    });
    return Array.from(values.values()).sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredEntries]);

  const completenessChecks = [
    Boolean(draft.title.trim()),
    filteredEntries.length > 0,
    Boolean(draft.introduction.trim()),
    Boolean(draft.reflection.trim()),
    Boolean(draft.conclusion.trim()),
    skills.length > 0,
  ];
  const completeness = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100,
  );

  function patchDraft(patch: Partial<ReportDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function patchSections(patch: Partial<ReportSections>) {
    setDraft((current) => ({
      ...current,
      sections: { ...current.sections, ...patch },
    }));
  }

  function exportJson() {
    downloadText(
      `practicora-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      "application/json",
    );
    toast.success(t(locale, "app.reports.json_backup_downloaded"));
  }

  function exportCsv() {
    const header = [
      t(locale, "app.reports.csv_date"),
      t(locale, "app.reports.csv_start"),
      t(locale, "app.reports.csv_end"),
      t(locale, "app.reports.csv_break"),
      t(locale, "app.reports.csv_hours"),
      t(locale, "app.reports.csv_project"),
      t(locale, "app.reports.csv_category"),
      t(locale, "app.reports.csv_mode"),
      t(locale, "app.reports.csv_work_done"),
      t(locale, "app.reports.csv_learning"),
      t(locale, "app.reports.csv_difficulties"),
      t(locale, "app.reports.csv_mood"),
      t(locale, "app.reports.csv_completed_tasks"),
      t(locale, "app.reports.csv_total_tasks"),
      t(locale, "app.reports.csv_skills"),
    ];
    const rows = filteredEntries.map((entry) => [
      entry.date,
      entry.start,
      entry.end,
      entry.breakMinutes,
      entry.hours.toFixed(2),
      entry.project,
      categoryLabels[entry.category],
      entry.workMode,
      entry.workDone,
      entry.learned,
      entry.difficulties,
      entry.mood,
      entry.todos.filter((todo) => todo.done).length,
      entry.todos.length,
      entry.tags.join("; "),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    downloadText(
      `practicora-${activeInternship.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`,
      `\uFEFF${csv}`,
      "text/csv;charset=utf-8",
    );
    toast.success(t(locale, "app.reports.csv_data_downloaded"));
  }

  function exportMarkdown() {
    const lines = [
      `# ${draft.title}`,
      "",
      `**${t(locale, "app.reports.internship")}:** ${activeInternship.name}`,
      `**${t(locale, "app.reports.company")}:** ${activeInternship.company || "—"}`,
      `**${t(locale, "app.reports.period")}:** ${draft.from || "—"} — ${draft.to || "—"}`,
      `**${t(locale, "app.reports.hours")}:** ${formatHours(totalHours)}`,
      "",
      `## ${t(locale, "app.reports.introduction")}`,
      draft.introduction || "—",
      "",
      `## ${t(locale, "app.reports.detailed_journal")}`,
      ...detailedEntries.flatMap((entry) => [
        "",
        `### ${formatDate(entry.date, locale)} — ${formatHours(entry.hours)}`,
        entry.workDone || entry.project || "—",
        entry.learned ? `- **${t(locale, "app.reports.learning_2")}:** ${entry.learned}` : "",
        entry.difficulties ? `- **${t(locale, "app.reports.challenges")}:** ${entry.difficulties}` : "",
      ]),
      "",
      `## ${t(locale, "app.reports.reflection")}`,
      draft.reflection || "—",
      "",
      `## ${t(locale, "app.reports.conclusion")}`,
      draft.conclusion || "—",
    ].filter(Boolean);
    downloadText(
      `${slugifyFile(draft.title)}.md`,
      lines.join("\n"),
      "text/markdown;charset=utf-8",
    );
    toast.success(t(locale, "app.reports.markdown_report_downloaded"));
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      importLegacy(payload?.payload && typeof payload.payload === "object" ? payload.payload : payload);
    } catch {
      toast.error(t(locale, "app.reports.the_json_file_is_invalid"));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submitToInstitution() {
    if (activeWorkspace?.kind !== "organization") return;
    const confirmed = await dialog.confirm({
      title: t(locale, "app.reports.submit_this_report"),
      description: t(locale, "app.reports.the_report_will_be_sent_to_your_institution_review_queue_this_creates_a_timestam"),
      confirmLabel: t(locale, "app.reports.submit"),
      cancelLabel: t(locale, "app.reports.keep_editing"),
      tone: "info",
    });
    if (!confirmed) return;
    setSubmitting(true);
    const content: SubmitInstitutionalReportInput["content"] = {
      schemaVersion: 1,
      internship: activeInternship,
      report: {
        ...draft,
        totalHours,
        entryCount: filteredEntries.length,
        detailedEntryCount: detailedEntries.length,
        omittedEntryCount,
        taskCount,
        completedTasks,
        skills,
        averageMood,
        completeness,
      },
      entries: detailedEntries,
      objectives,
      evidence,
      generatedAt: new Date().toISOString(),
    };
    const result = await submitInstitutionalReport(activeWorkspace.organizationId, {
      title: draft.title,
      reportType: draft.reportType,
      periodStart: draft.from,
      periodEnd: draft.to,
      totalHours,
      content,
      status: "submitted",
    });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(t(locale, "app.reports.report_submitted_to_the_institution"));
  }

  const canSubmitInstitutionally =
    activeWorkspace?.kind === "organization" && activeWorkspace.roleKeys.includes("student");

  return (
    <>
      <PageHeader
        title={t(locale, "app.reports.report_studio")}
        description={t(locale, "app.reports.filter_data_write_each_section_visualize_progress_and_produce_a_professional_ver")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" />
              {t(locale, "app.reports.print_pdf")}
            </Button>
            {canSubmitInstitutionally ? (
              <Button onClick={() => void submitToInstitution()} disabled={submitting || !filteredEntries.length}>
                <Send className="size-4" />
                {submitting ? (t(locale, "app.reports.submitting")) : (t(locale, "app.reports.submit"))}
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="print-hidden mb-5">
        <FilterPanel
          title={t(locale, "app.reports.data_filters")}
          summary={t(locale, "app.reports.filtered_days_summary", { count: filteredEntries.length })}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          clearLabel={t(locale, "app.reports.clear_filters")}
          onClear={() => patchDraft({ from: firstEntryDate, to: lastEntryDate, category: "all", workMode: "all", query: "" })}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div><FieldLabel>{t(locale, "app.reports.from")}</FieldLabel><DatePicker value={draft.from} onChange={(value) => patchDraft({ from: value })} locale={locale} /></div>
            <div><FieldLabel>{t(locale, "app.reports.to")}</FieldLabel><DatePicker value={draft.to} onChange={(value) => patchDraft({ to: value })} locale={locale} min={draft.from || undefined} /></div>
            <div><FieldLabel>{t(locale, "app.reports.category")}</FieldLabel><Select value={draft.category} onValueChange={(value) => patchDraft({ category: value as ReportDraft["category"] })} options={[{ value: "all", label: t(locale, "app.reports.all_categories") }, ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))]} /></div>
            <div><FieldLabel>{t(locale, "app.reports.work_mode")}</FieldLabel><Select value={draft.workMode} onValueChange={(value) => patchDraft({ workMode: value as ReportDraft["workMode"] })} options={[{ value: "all", label: t(locale, "app.reports.all_modes") }, { value: "onsite", label: t(locale, "app.reports.on_site") }, { value: "remote", label: t(locale, "app.reports.remote") }, { value: "hybrid", label: t(locale, "app.reports.hybrid") }]} /></div>
            <div><FieldLabel>{t(locale, "app.reports.search_report_content")}</FieldLabel><div className="relative"><Filter className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={draft.query} onChange={(event) => patchDraft({ query: event.target.value })} placeholder={t(locale, "app.reports.project_technology_learning")} /></div></div>
          </div>
        </FilterPanel>
      </div>

      <div className="print-hidden grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Gauge} label={t(locale, "app.reports.completeness")} value={`${completeness}%`} tone={completeness >= 80 ? "success" : "warning"} />
        <MetricCard icon={FileText} label={t(locale, "app.reports.included_days")} value={String(filteredEntries.length)} meta={formatHours(totalHours)} />
        <MetricCard icon={ClipboardCheck} label={t(locale, "app.reports.completed_tasks")} value={`${completedTasks}/${taskCount}`} tone="info" />
        <MetricCard icon={GraduationCap} label={t(locale, "app.reports.skills")} value={String(skills.length)} meta={t(locale, "app.reports.found_in_the_period")} />
      </div>

      <div className="print-hidden mt-5 grid gap-5 2xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-extrabold">{t(locale, "app.reports.report_configuration")}</h2>
                <p className="mt-1 text-sm text-muted">{t(locale, "app.reports.every_change_is_saved_automatically")}</p>
              </div>
              <Sparkles className="size-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <FieldLabel>{t(locale, "app.reports.report_type")}</FieldLabel>
                <Select
                  value={draft.reportType}
                  onValueChange={(value) => patchDraft({ reportType: value as ReportType })}
                  options={[
                    { value: "weekly", label: t(locale, "app.reports.weekly_report") },
                    { value: "monthly", label: t(locale, "app.reports.monthly_report") },
                    { value: "final", label: t(locale, "app.reports.final_report") },
                    { value: "portfolio", label: t(locale, "app.reports.skills_portfolio") },
                  ]}
                />
              </div>
              <div>
                <FieldLabel>{t(locale, "app.reports.title")}</FieldLabel>
                <Input value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} />
              </div>
              <div>
                <FieldLabel>{t(locale, "app.reports.detail_level")}</FieldLabel>
                <Select
                  value={draft.detailLevel}
                  onValueChange={(value) => patchDraft({ detailLevel: value as DetailLevel })}
                  options={[
                    { value: "concise", label: t(locale, "app.reports.detail_concise") },
                    { value: "standard", label: t(locale, "app.reports.detail_standard") },
                    { value: "complete", label: t(locale, "app.reports.detail_complete") },
                  ]}
                />
                <FieldHint>{t(locale, "app.reports.detail_level_hint", { shown: detailedEntries.length, total: filteredEntries.length })}</FieldHint>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "app.reports.included_sections")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.reports.customize_the_printed_and_submitted_version")}</p></div></CardHeader>
            <CardContent className="space-y-2">
              {([
                ["summary", t(locale, "app.reports.summary_and_metrics")],
                ["analytics", t(locale, "app.reports.progress_charts")],
                ["objectives", t(locale, "app.reports.goals")],
                ["skills", t(locale, "app.reports.skills")],
                ["dailyJournal", t(locale, "app.reports.detailed_journal")],
                ["evidence", t(locale, "app.reports.evidence_and_links")],
                ["reflection", t(locale, "app.reports.reflection_and_conclusion")],
              ] as Array<[keyof ReportSections, string]>).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-3.5 py-3">
                  <span className="text-sm font-bold">{label}</span>
                  <Switch checked={draft.sections[key]} onCheckedChange={(checked) => patchSections({ [key]: checked })} ariaLabel={label} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "app.reports.exports_and_backup")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.reports.portable_formats_for_your_institution_supervisor_or_portfolio")}</p></div></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              <Button variant="secondary" className="justify-start" onClick={exportJson}><FileJson className="size-4" />{t(locale, "app.reports.json_backup")}</Button>
              <Button variant="secondary" className="justify-start" onClick={exportCsv}><FileSpreadsheet className="size-4" />{t(locale, "app.reports.format_csv")}</Button>
              <Button variant="secondary" className="justify-start" onClick={exportMarkdown}><FileText className="size-4" />{t(locale, "app.reports.format_markdown")}</Button>
              <Button variant="secondary" className="justify-start" onClick={() => fileInput.current?.click()}><Upload className="size-4" />{t(locale, "app.reports.import_json")}</Button>
              <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importFile(event.target.files?.[0])} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "app.reports.writing")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.reports.these_texts_appear_in_the_final_report_and_remain_as_a_browser_draft")}</p></div></CardHeader>
            <CardContent className="space-y-5">
              <div><FieldLabel>{t(locale, "app.reports.introduction_and_context")}</FieldLabel><Textarea value={draft.introduction} onChange={(event) => patchDraft({ introduction: event.target.value })} rows={5} placeholder={t(locale, "app.reports.present_the_organization_your_role_goals_and_covered_period")} /><FieldHint>{t(locale, "app.reports.describe_the_context_without_repeating_every_day")}</FieldHint></div>
              <div><FieldLabel>{t(locale, "app.reports.professional_reflection")}</FieldLabel><Textarea value={draft.reflection} onChange={(event) => patchDraft({ reflection: event.target.value })} rows={6} placeholder={t(locale, "app.reports.analyze_your_progress_decisions_challenges_and_developed_skills")} /></div>
              <div><FieldLabel>{t(locale, "app.reports.conclusion_and_next_steps")}</FieldLabel><Textarea value={draft.conclusion} onChange={(event) => patchDraft({ conclusion: event.target.value })} rows={5} placeholder={t(locale, "app.reports.summarize_results_and_outline_your_next_professional_development_steps")} /></div>
            </CardContent>
          </Card>

          {draft.sections.analytics ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "app.reports.hours_by_week")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.reports.logged_workload_trend")}</p></div></CardHeader><CardContent><div className="h-[280px]">{weeklyData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}><defs><linearGradient id="reportHoursGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f6f9f" stopOpacity={0.35} /><stop offset="100%" stopColor="#2f6f9f" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} /><XAxis dataKey="week" tickFormatter={(value) => shortDate(value, locale)} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(value) => formatDate(String(value), locale)} formatter={(value) => [formatHours(Number(value)), t(locale, "app.reports.hours")]} /><Area type="monotone" dataKey="hours" stroke="#2f6f9f" fill="url(#reportHoursGradient)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer> : <ChartEmpty text={t(locale, "app.reports.no_data_in_this_period")} />}</div></CardContent></Card>
              <Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "app.reports.activity_distribution")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.reports.hours_by_work_category")}</p></div></CardHeader><CardContent><div className="h-[280px]">{categoryData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="hours" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>{categoryData.map((item) => <Cell key={item.key} fill={CATEGORY_COLORS[item.key]} />)}</Pie><Tooltip formatter={(value) => formatHours(Number(value))} /><Legend verticalAlign="bottom" iconType="circle" /></PieChart></ResponsiveContainer> : <ChartEmpty text={t(locale, "app.reports.no_categories_to_display")} />}</div></CardContent></Card>
            </div>
          ) : null}
        </div>
      </div>

      <ReportPreview
        locale={locale}
        draft={draft}
        internship={activeInternship}
        settings={data.settings}
        entries={detailedEntries}
        totalEntryCount={filteredEntries.length}
        omittedEntryCount={omittedEntryCount}
        objectives={objectives}
        skills={skills}
        evidence={evidence}
        totalHours={totalHours}
        completedTasks={completedTasks}
        taskCount={taskCount}
        averageMood={averageMood}
        weeklyData={weeklyData}
        categoryData={categoryData}
      />
    </>
  );
}

function ReportPreview({
  locale,
  draft,
  internship,
  settings,
  entries,
  totalEntryCount,
  omittedEntryCount,
  objectives,
  skills,
  evidence,
  totalHours,
  completedTasks,
  taskCount,
  averageMood,
  weeklyData,
  categoryData,
}: {
  locale: string;
  draft: ReportDraft;
  internship: ReturnType<typeof usePracticora>["activeInternship"];
  settings: ReturnType<typeof usePracticora>["data"]["settings"];
  entries: JournalEntry[];
  totalEntryCount: number;
  omittedEntryCount: number;
  objectives: ReturnType<typeof usePracticora>["activeObjectives"];
  skills: string[];
  evidence: Array<{ id: string; label: string; url: string; entryDate: string }>;
  totalHours: number;
  completedTasks: number;
  taskCount: number;
  averageMood: number;
  weeklyData: Array<{ week: string; hours: number; tasks: number }>;
  categoryData: Array<{ key: JournalCategory; name: string; hours: number }>;
}) {
  return (
    <article className="print-report mt-7 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-9 lg:p-12">
      <header className="border-b-3 border-primary pb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">{t(locale, "app.reports.report_brand_separator")} {t(locale, "app.reports.professional_report")}</div>
          <div className="text-xs font-bold text-muted">{draft.from || "—"} — {draft.to || "—"}</div>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-4xl">{draft.title || internship.name}</h1>
        <div className="mt-5 grid gap-3 text-sm text-muted-strong sm:grid-cols-2 lg:grid-cols-4">
          <Meta label={t(locale, "app.reports.student")} value={settings.name || "—"} />
          <Meta label={t(locale, "app.reports.company")} value={internship.company || "—"} />
          <Meta label={t(locale, "app.reports.role")} value={internship.role || "—"} />
          <Meta label={t(locale, "app.reports.supervisor")} value={internship.supervisor || "—"} />
        </div>
      </header>

      {draft.introduction ? <ReportTextSection title={t(locale, "app.reports.introduction_and_context")} text={draft.introduction} /> : null}

      {draft.sections.summary ? <section className="mt-8"><ReportSectionTitle>{t(locale, "app.reports.summary")}</ReportSectionTitle><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Summary value={formatHours(totalHours)} label={t(locale, "app.reports.logged_hours")} /><Summary value={String(totalEntryCount)} label={t(locale, "app.reports.logged_days")} /><Summary value={`${completedTasks}/${taskCount}`} label={t(locale, "app.reports.completed_tasks_2")} /><Summary value={averageMood ? `${averageMood.toFixed(1)}/5` : "—"} label={t(locale, "app.reports.average_mood")} /></div></section> : null}

      {draft.sections.analytics && (weeklyData.length || categoryData.length) ? <section className="mt-8 break-inside-avoid"><ReportSectionTitle>{t(locale, "app.reports.progress_and_distribution")}</ReportSectionTitle><div className="mt-4 grid gap-5 lg:grid-cols-2"><div className="h-[230px] rounded-xl border border-border p-3">{weeklyData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -22, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} /><XAxis dataKey="week" tickFormatter={(value) => shortDate(value, locale)} tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => formatHours(Number(value))} /><Bar dataKey="hours" fill="#2f6f9f" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer> : null}</div><div className="h-[230px] rounded-xl border border-border p-3">{categoryData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="hours" nameKey="name" innerRadius={45} outerRadius={75}>{categoryData.map((item) => <Cell key={item.key} fill={CATEGORY_COLORS[item.key]} />)}</Pie><Tooltip formatter={(value) => formatHours(Number(value))} /><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer> : null}</div></div></section> : null}

      {draft.sections.skills && skills.length ? <section className="mt-8"><ReportSectionTitle>{t(locale, "app.reports.skills_and_technologies")}</ReportSectionTitle><div className="mt-4 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-full border border-primary/15 bg-primary-softer px-3 py-1.5 text-sm font-semibold text-primary-strong">{skill}</span>)}</div></section> : null}

      {draft.sections.objectives ? <section className="mt-8"><ReportSectionTitle>{t(locale, "app.reports.goals")}</ReportSectionTitle><div className="mt-4 space-y-3">{objectives.length ? objectives.map((objective) => <div key={objective.id} className="break-inside-avoid rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-4"><h3 className="font-bold">{objective.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${objective.completed ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{objective.completed ? (t(locale, "app.reports.completed")) : (t(locale, "app.reports.in_progress"))}</span></div>{objective.description ? <p className="mt-2 text-sm leading-6 text-muted-strong">{objective.description}</p> : null}</div>) : <p className="text-sm text-muted">{t(locale, "app.reports.no_goals_recorded")}</p>}</div></section> : null}

      {draft.sections.dailyJournal ? <section className="mt-8"><ReportSectionTitle>{t(locale, "app.reports.detailed_journal")}</ReportSectionTitle>{omittedEntryCount > 0 ? <p className="mt-3 rounded-xl border border-primary/15 bg-primary-softer/45 px-4 py-3 text-sm text-muted-strong">{t(locale, "app.reports.entries_omitted_notice", { shown: entries.length, total: totalEntryCount })}</p> : null}<div className="mt-4 space-y-4">{entries.length ? entries.map((entry) => <ReportEntry key={entry.id} entry={entry} locale={locale} />) : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">{t(locale, "app.reports.no_day_matches_the_filters")}</p>}</div></section> : null}

      {draft.sections.evidence && evidence.length ? <section className="mt-8"><ReportSectionTitle>{t(locale, "app.reports.evidence_and_references")}</ReportSectionTitle><div className="mt-4 grid gap-3 sm:grid-cols-2">{evidence.map((item) => <div key={`${item.entryDate}-${item.id}`} className="break-inside-avoid rounded-xl border border-border p-4"><div className="text-xs font-bold text-muted">{formatDate(item.entryDate, locale)}</div><div className="mt-1 font-bold">{item.label}</div><div className="mt-1 break-all text-xs text-primary">{item.url}</div></div>)}</div></section> : null}

      {draft.sections.reflection ? <>{draft.reflection ? <ReportTextSection title={t(locale, "app.reports.professional_reflection")} text={draft.reflection} /> : null}{draft.conclusion ? <ReportTextSection title={t(locale, "app.reports.conclusion_and_next_steps")} text={draft.conclusion} /> : null}</> : null}

      <footer className="mt-10 border-t border-border pt-5 text-xs leading-5 text-muted">{t(locale, "app.reports.report_generated_with_practicora_information_comes_from_the_selected_entries_and")}</footer>
    </article>
  );
}

function ReportEntry({ entry, locale }: { entry: JournalEntry; locale: string }) {
  return <div className="break-inside-avoid rounded-xl border border-border p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold">{formatDate(entry.date, locale)}</h3><span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">{formatHours(entry.hours)}</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{entry.workDone || entry.project ? <ReportField label={t(locale, "app.reports.work_completed")} value={entry.workDone || entry.project} /> : null}{entry.achievements ? <ReportField label={t(locale, "app.reports.achievements")} value={entry.achievements} /> : null}{entry.learned ? <ReportField label={t(locale, "app.reports.learning_2")} value={entry.learned} /> : null}{entry.difficulties ? <ReportField label={t(locale, "app.reports.challenges_and_solutions")} value={[entry.difficulties, entry.blockers].filter(Boolean).join("\n")} /> : null}{entry.feedback ? <ReportField label={t(locale, "app.reports.feedback")} value={entry.feedback} /> : null}{entry.nextSteps ? <ReportField label={t(locale, "app.reports.next_steps")} value={entry.nextSteps} /> : null}</div>{entry.todos.length ? <div className="mt-4 border-t border-border pt-4"><div className="text-xs font-extrabold uppercase tracking-[.08em] text-muted">{t(locale, "app.reports.tasks")}</div><ul className="mt-2 grid gap-1.5 sm:grid-cols-2">{entry.todos.map((todo) => <li key={todo.id} className="flex items-start gap-2 text-sm"><CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${todo.done ? "text-success" : "text-muted"}`} /><span className={todo.done ? "text-muted-strong" : "text-foreground"}>{todo.text}</span></li>)}</ul></div> : null}</div>;
}

function ReportTextSection({ title, text }: { title: string; text: string }) {
  return <section className="mt-8 break-inside-avoid"><ReportSectionTitle>{title}</ReportSectionTitle><p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-muted-strong">{text}</p></section>;
}

function ReportSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-primary/15 pb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-primary">{children}</h2>;
}

function ReportField({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-muted">{label}</div><p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted-strong">{value}</p></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-[10px] font-extrabold uppercase tracking-[.08em] text-muted">{label}</span><strong className="mt-1 block text-foreground">{value}</strong></div>;
}

function Summary({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-primary/12 bg-primary-softer/55 p-4 text-center"><div className="text-2xl font-extrabold tracking-[-.04em] text-primary-strong">{value}</div><div className="mt-1 text-xs font-semibold text-muted">{label}</div></div>;
}

function ChartEmpty({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 text-center text-sm font-semibold text-muted">{text}</div>;
}

function formatDate(value: string, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(t(locale, "app.reports.en_ca"), { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
}

function shortDate(value: string, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(t(locale, "app.reports.en_ca"), { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function slugifyFile(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "practicora-report";
}
