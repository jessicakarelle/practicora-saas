"use client";

import { translate as t } from "@/i18n";

import { use, useMemo, useState } from "react";
import { CheckCircle2, Circle, Filter, Goal, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useDialog } from "@/components/ui/dialog-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useStageLog } from "@/lib/store";
import type { Objective } from "@/lib/types";

export default function ObjectivesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const dialog = useDialog();
  const { activeInternship, activeObjectives, addObjective, updateObjective, deleteObjective } = useStageLog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState<Objective["category"]>("technical");
  const [priority, setPriority] = useState<Objective["priority"]>("medium");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function createObjective() {
    if (!title.trim()) {
      await dialog.validation({ title: t(locale, "app.objectives.incomplete_goal"), description: t(locale, "app.objectives.add_a_clear_title_before_creating_the_goal"), details: [t(locale, "app.objectives.a_title_is_required")] });
      return;
    }
    addObjective({ internshipId: activeInternship.id, title: title.trim(), description: description.trim(), category, priority, progress: 0, successMetric: successMetric.trim(), deadline, completed: false });
    setTitle(""); setDescription(""); setSuccessMetric(""); setDeadline(""); setCategory("technical"); setPriority("medium");
  }

  async function removeObjective(objective: Objective) {
    const accepted = await dialog.confirm({ title: t(locale, "app.objectives.delete_this_goal"), description: objective.title, tone: "danger", confirmLabel: t(locale, "app.objectives.delete") });
    if (accepted) deleteObjective(objective.id);
  }

  const categories = [
    { value: "technical", label: t(locale, "app.objectives.technical") },
    { value: "communication", label: t(locale, "common.misc.communication") },
    { value: "organization", label: t(locale, "app.objectives.organization") },
    { value: "autonomy", label: t(locale, "app.objectives.autonomy") },
    { value: "career", label: t(locale, "app.objectives.career") },
    { value: "other", label: t(locale, "app.objectives.other") },
  ];
  const priorities = [
    { value: "low", label: t(locale, "app.objectives.low") },
    { value: "medium", label: t(locale, "app.objectives.medium") },
    { value: "high", label: t(locale, "app.objectives.high") },
  ];

  const filtered = useMemo(() => activeObjectives.filter((objective) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || `${objective.title} ${objective.description} ${objective.successMetric}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || (statusFilter === "done" ? objective.completed : !objective.completed);
    const matchesCategory = categoryFilter === "all" || objective.category === categoryFilter;
    return matchesQuery && matchesStatus && matchesCategory;
  }).sort((a, b) => Number(a.completed) - Number(b.completed) || (a.deadline || "9999").localeCompare(b.deadline || "9999")), [activeObjectives, categoryFilter, search, statusFilter]);

  return <>
    <PageHeader title={t(locale, "app.objectives.goals")} description={t(locale, "app.objectives.define_measurable_outcomes_set_priorities_and_update_progress_without_save_butto")} />
    <Card>
      <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.objectives.new_goal")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.objectives.a_strong_goal_explains_the_expected_outcome_and_how_success_will_be_verified")}</p></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2"><div><FieldLabel>{t(locale, "app.objectives.goal")}</FieldLabel><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t(locale, "app.objectives.e_g_make_automated_qa_reliable")} /></div><div><FieldLabel>{t(locale, "app.objectives.success_metric")}</FieldLabel><Input value={successMetric} onChange={(event) => setSuccessMetric(event.target.value)} placeholder={t(locale, "app.objectives.e_g_95_of_critical_scenarios_pass")} /></div></div>
        <div><FieldLabel>{t(locale, "app.objectives.description")}</FieldLabel><Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><FieldLabel>{t(locale, "app.objectives.category")}</FieldLabel><Select value={category} onValueChange={(value) => setCategory(value as Objective["category"])} options={categories} /></div><div><FieldLabel>{t(locale, "app.objectives.priority")}</FieldLabel><Select value={priority} onValueChange={(value) => setPriority(value as Objective["priority"])} options={priorities} /></div><div><FieldLabel>{t(locale, "app.objectives.deadline")}</FieldLabel><DatePicker value={deadline} onChange={setDeadline} locale={locale} /></div><div className="flex items-end"><Button type="button" onClick={() => void createObjective()} className="w-full"><Plus className="size-4" />{t(locale, "app.objectives.add")}</Button></div></div>
      </CardContent>
    </Card>

    <Card className="mt-5"><CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_210px]"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "app.objectives.search_goals")} /></div><Select value={statusFilter} onValueChange={setStatusFilter} startIcon={<Filter className="size-4" />} options={[{ value: "all", label: t(locale, "app.objectives.all_statuses") }, { value: "active", label: t(locale, "app.objectives.active") }, { value: "done", label: t(locale, "app.objectives.completed") }]} /><Select value={categoryFilter} onValueChange={setCategoryFilter} options={[{ value: "all", label: t(locale, "app.objectives.all_categories") }, ...categories]} /></CardContent></Card>

    <div className="mt-5 space-y-3">{filtered.length ? filtered.map((objective) => <Card key={objective.id}><CardContent className="space-y-4"><div className="flex items-start gap-3"><button className="mt-0.5 text-primary" onClick={() => updateObjective(objective.id, { completed: !objective.completed, progress: objective.completed ? Math.min(objective.progress, 95) : 100 })} aria-label={t(locale, "app.objectives.toggle_status")}>{objective.completed ? <CheckCircle2 className="size-6 text-success" /> : <Circle className="size-6" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Input className={`h-auto border-0 bg-transparent px-0 text-base font-bold focus:ring-0 ${objective.completed ? "text-muted line-through" : "text-foreground"}`} value={objective.title} onChange={(event) => updateObjective(objective.id, { title: event.target.value })} /><span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">{categories.find((item) => item.value === objective.category)?.label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${objective.priority === "high" ? "bg-danger/10 text-danger" : objective.priority === "low" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{priorities.find((item) => item.value === objective.priority)?.label}</span></div><Textarea className="mt-2 min-h-20 border-0 bg-background" value={objective.description} onChange={(event) => updateObjective(objective.id, { description: event.target.value })} placeholder={t(locale, "app.objectives.description")} /></div><Button variant="ghost" size="sm" onClick={() => void removeObjective(objective)}><Trash2 className="size-4 text-danger" /></Button></div><div className="grid gap-4 md:grid-cols-[1fr_180px_180px]"><div><div className="flex items-center justify-between text-xs font-bold text-muted-strong"><span>{t(locale, "app.objectives.progress")}</span><span>{objective.progress}%</span></div><input type="range" min={0} max={100} step={5} value={objective.progress} onChange={(event) => { const progress = Number(event.target.value); updateObjective(objective.id, { progress, completed: progress === 100 }); }} className="mt-2 w-full accent-[var(--primary)]" /><FieldHint>{t(locale, "app.objectives.progress_is_saved_automatically")}</FieldHint></div><div><FieldLabel>{t(locale, "app.objectives.category")}</FieldLabel><Select value={objective.category} onValueChange={(value) => updateObjective(objective.id, { category: value as Objective["category"] })} options={categories} /></div><div><FieldLabel>{t(locale, "app.objectives.priority")}</FieldLabel><Select value={objective.priority} onValueChange={(value) => updateObjective(objective.id, { priority: value as Objective["priority"] })} options={priorities} /></div></div><div className="grid gap-4 md:grid-cols-2"><div><FieldLabel>{t(locale, "app.objectives.success_metric")}</FieldLabel><Input value={objective.successMetric} onChange={(event) => updateObjective(objective.id, { successMetric: event.target.value })} /></div><div><FieldLabel>{t(locale, "app.objectives.deadline")}</FieldLabel><DatePicker value={objective.deadline} onChange={(value) => updateObjective(objective.id, { deadline: value })} locale={locale} /></div></div></CardContent></Card>) : <EmptyState icon={Goal} title={t(locale, "app.objectives.no_matching_goals")} description={t(locale, "app.objectives.add_a_goal_or_change_the_filters")} />}</div>
  </>;
}
