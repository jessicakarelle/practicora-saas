"use client";

import { translate as t } from "@/i18n";

import { use, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useStageLog } from "@/lib/store";
import type { EvaluationDimensions } from "@/lib/types";

export default function EvaluationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { data, updateEvaluation } = useStageLog();
  const [skill, setSkill] = useState("");
  const evaluation = data.evaluation;

  function addSkill() {
    const next = skill.trim();
    if (!next || evaluation.skills.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    updateEvaluation({ skills: [...evaluation.skills, next] });
    setSkill("");
  }

  const dimensionLabels: Record<keyof EvaluationDimensions, string> = {
    technical: t(locale, "app.evaluation.technical_skills"),
    communication: "Communication",
    autonomy: t(locale, "app.evaluation.autonomy"),
    organization: t(locale, "app.evaluation.organization"),
    collaboration: "Collaboration",
    problemSolving: t(locale, "app.evaluation.problem_solving"),
  };
  const scoreOptions = [0,1,2,3,4,5].map((value) => ({ value: String(value), label: value === 0 ? (t(locale, "app.evaluation.not_rated")) : `${value}/5` }));

  return <>
    <PageHeader title={t(locale, "app.evaluation.evaluation")} description={t(locale, "app.evaluation.prepare_a_structured_self_evaluation_keep_received_feedback_and_track_six_growth")} />
    <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
      <Card><CardContent><FieldLabel>{t(locale, "app.evaluation.overall_rating")}</FieldLabel><div className="flex gap-2">{[1,2,3,4,5].map((value) => <button key={value} type="button" className="rounded-lg p-1" onClick={() => updateEvaluation({ stars: value })} aria-label={`${value}/5`}><Star className={`size-8 transition-colors ${value <= evaluation.stars ? "fill-warning text-warning" : "text-border-strong"}`} /></button>)}</div><div className="mt-6"><FieldLabel>{t(locale, "app.evaluation.grade_or_result")}</FieldLabel><Input value={evaluation.grade} onChange={(event) => updateEvaluation({ grade: event.target.value })} placeholder={t(locale, "app.evaluation.e_g_excellent_92_a")} /><FieldHint>{t(locale, "app.evaluation.autosaved_after_every_change")}</FieldHint></div></CardContent></Card>
      <Card><CardContent><FieldLabel>{t(locale, "app.evaluation.self_evaluation_summary")}</FieldLabel><Textarea rows={8} value={evaluation.comments} onChange={(event) => updateEvaluation({ comments: event.target.value })} placeholder={t(locale, "app.evaluation.summarize_growth_observable_evidence_and_value_delivered")} /></CardContent></Card>
    </div>
    <Card className="mt-5"><CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.evaluation.growth_dimensions")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.evaluation.use_the_same_scale_throughout_the_internship_to_observe_a_credible_trend")}</p></div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(Object.keys(dimensionLabels) as Array<keyof EvaluationDimensions>).map((dimension) => <div key={dimension}><FieldLabel>{dimensionLabels[dimension]}</FieldLabel><Select value={String(evaluation.dimensions[dimension])} onValueChange={(value) => updateEvaluation({ dimensions: { ...evaluation.dimensions, [dimension]: Number(value) } })} options={scoreOptions} /></div>)}</CardContent></Card>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Card><CardContent><FieldLabel>{t(locale, "app.evaluation.observed_strengths")}</FieldLabel><Textarea rows={6} value={evaluation.strengths} onChange={(event) => updateEvaluation({ strengths: event.target.value })} placeholder={t(locale, "app.evaluation.concrete_examples_behaviours_and_outcomes_that_demonstrate_your_strengths")} /></CardContent></Card><Card><CardContent><FieldLabel>{t(locale, "app.evaluation.areas_for_improvement")}</FieldLabel><Textarea rows={6} value={evaluation.improvements} onChange={(event) => updateEvaluation({ improvements: event.target.value })} placeholder={t(locale, "app.evaluation.skills_to_deepen_and_planned_actions")} /></CardContent></Card></div>
    <Card className="mt-5"><CardContent><FieldLabel>{t(locale, "app.evaluation.supervisor_feedback")}</FieldLabel><Textarea rows={5} value={evaluation.supervisorFeedback} onChange={(event) => updateEvaluation({ supervisorFeedback: event.target.value })} placeholder={t(locale, "app.evaluation.record_important_feedback_received_during_meetings")} /></CardContent></Card>
    <Card className="mt-5"><CardContent><h2 className="text-lg font-bold">{t(locale, "app.evaluation.recognized_skills")}</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Input value={skill} onChange={(event) => setSkill(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder={t(locale, "app.evaluation.e_g_autonomy")} /><Button type="button" onClick={addSkill}><Plus className="size-4" />{t(locale, "app.evaluation.add")}</Button></div><div className="mt-4 flex flex-wrap gap-2">{evaluation.skills.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-sm font-semibold text-success">{item}<button onClick={() => updateEvaluation({ skills: evaluation.skills.filter((value) => value !== item) })} aria-label={t(locale, "app.evaluation.remove")}><X className="size-3.5" /></button></span>)}</div></CardContent></Card>
  </>;
}
