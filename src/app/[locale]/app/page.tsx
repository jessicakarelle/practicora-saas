"use client";

import { localeTag, translate as t } from "@/i18n";
import { use, useMemo } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CalendarDays, CheckCircle2, Clock3, Goal, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useStageLog } from "@/lib/store";
import { formatHours } from "@/lib/utils";

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeEntries, activeInternship, activeObjectives } = useStageLog();
  const sorted = useMemo(() => [...activeEntries].sort((a, b) => a.date.localeCompare(b.date)), [activeEntries]);
  const totalHours = sorted.reduce((sum, entry) => sum + entry.hours, 0);
  const completedTasks = sorted.flatMap((entry) => entry.todos).filter((todo) => todo.done).length;
  const totalTasks = sorted.flatMap((entry) => entry.todos).length;
  const moodAverage = sorted.length ? sorted.reduce((sum, entry) => sum + entry.mood, 0) / sorted.length : 0;
  const progress = Math.min(100, activeInternship.goalHours ? (totalHours / activeInternship.goalHours) * 100 : 0);
  const chartData = sorted.slice(-10).map((entry) => ({
    date: entry.date.slice(5),
    fullDate: entry.date,
    hours: entry.hours,
  }));
  const recent = [...sorted].reverse().slice(0, 4);
  const openObjectives = activeObjectives.filter((objective) => !objective.completed).slice(0, 4);

  return (
    <>
      <PageHeader
        title={t(locale, "app.dashboard.dashboard")}
        description={t(locale, "app.dashboard.progress_recent_days_and_next_priorities_in_one_view")}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        <MetricCard icon={Clock3} label={t(locale, "app.dashboard.logged_hours")} value={formatHours(totalHours)} meta={`${Math.round(progress)}% ${t(locale, "app.dashboard.of_goal")}`} />
        <MetricCard icon={CalendarDays} label={t(locale, "app.dashboard.logged_days")} value={String(sorted.length)} meta={t(locale, "app.dashboard.complete_entries")} tone="info" />
        <MetricCard icon={CheckCircle2} label={t(locale, "app.dashboard.tasks_completed")} value={`${completedTasks}/${totalTasks || 0}`} meta={t(locale, "app.dashboard.across_entries")} tone="success" />
        <MetricCard icon={Sparkles} label={t(locale, "app.dashboard.average_mood")} value={moodAverage ? moodAverage.toFixed(1) : "—"} meta={t(locale, "app.dashboard.on_a_5_point_scale")} tone="warning" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.8fr)]">
        <Card className="min-w-0">
          <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.dashboard.hours_over_time")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.dashboard.last_ten_logged_days")}</p></div><BarChart3 className="size-5 text-primary" /></CardHeader>
          <CardContent>
            {chartData.length ? (
              <div className="h-72 min-w-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 6, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "color-mix(in srgb, var(--primary) 7%, transparent)" }} content={<DashboardChartTooltip locale={locale} />} />
                    <Bar dataKey="hours" fill="var(--primary)" radius={[7, 7, 2, 2]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState icon={BarChart3} title={t(locale, "app.dashboard.no_data_yet")} description={t(locale, "app.dashboard.the_chart_will_be_built_from_your_logged_days")} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.dashboard.internship_progress")}</h2><p className="mt-1 text-sm text-muted">{activeInternship.company || t(locale, "app.dashboard.company_not_set")}</p></div></CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold tracking-[-0.05em] text-foreground">{Math.round(progress)}%</div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-strong"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted"><span>{formatHours(totalHours)}</span><span>{formatHours(activeInternship.goalHours)}</span></div>
            <div className="mt-6 rounded-xl border border-border bg-background p-4"><div className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{t(locale, "app.dashboard.active_goals")}</div><div className="mt-2 text-2xl font-extrabold">{activeObjectives.filter((objective) => !objective.completed).length}</div></div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.dashboard.recent_days")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.dashboard.your_most_recent_entries")}</p></div><Link className="text-sm font-bold text-primary hover:text-primary-strong" href={`/${locale}/app/journal/history`}>{t(locale, "app.dashboard.view_all")}</Link></CardHeader>
          <CardContent className="space-y-3">{recent.length ? recent.map((entry) => <Link href={`/${locale}/app/journal/edit/${entry.id}`} key={entry.id} className="block rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/35"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{new Intl.DateTimeFormat(t(locale, "app.dashboard.en_ca"), { dateStyle: "medium" }).format(new Date(`${entry.date}T12:00:00`))}</span><span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">{formatHours(entry.hours)}</span></div><p className="mt-2 line-clamp-2 text-sm leading-5 text-muted">{entry.workDone}</p></Link>) : <EmptyState icon={CalendarDays} title={t(locale, "app.dashboard.no_entries")} description={t(locale, "app.dashboard.your_history_will_appear_here")} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><h2 className="text-lg font-bold">{t(locale, "app.dashboard.priority_goals")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.dashboard.your_next_outcomes")}</p></div><Link className="text-sm font-bold text-primary hover:text-primary-strong" href={`/${locale}/app/objectives`}>{t(locale, "app.dashboard.manage")}</Link></CardHeader>
          <CardContent className="space-y-3">{openObjectives.length ? openObjectives.map((objective) => <div key={objective.id} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Goal className="size-4" /></span><div><div className="text-sm font-bold">{objective.title}</div><p className="mt-1 text-sm leading-5 text-muted">{objective.description || t(locale, "app.dashboard.no_description")}</p></div></div>) : <EmptyState icon={Goal} title={t(locale, "app.dashboard.no_active_goals")} description={t(locale, "app.dashboard.add_a_goal_to_guide_your_progress")} />}</CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardChartTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value?: number; payload?: { fullDate?: string } }>; locale: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const date = item.payload?.fullDate
    ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(`${item.payload.fullDate}T12:00:00`))
    : "";
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-[var(--shadow-float)]">
      <div className="text-xs font-bold text-muted">{date}</div>
      <div className="mt-1 text-sm font-extrabold text-foreground">{formatHours(Number(item.value || 0))}</div>
    </div>
  );
}
