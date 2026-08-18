"use client";

import { localeTag, translate as t } from "@/i18n";

import { use, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ListChecks,
  Smile,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/field";
import { FilterPanel } from "@/components/ui/filter-panel";
import { useStageLog } from "@/lib/store";
import { formatHours } from "@/lib/utils";

const chartColors = [
  "var(--primary)",
  "var(--secondary)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--info)",
];

type TooltipKind = "hours" | "rating" | "number";

type TooltipPayloadItem = {
  payload?: {
    fullDate?: string;
  };
};

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const fr = locale !== "en";
  const localeCode = t(locale, "app.analytics.en_ca");
  const { activeEntries, activeInternship } = useStageLog();
  const [period, setPeriod] = useState("90");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [workMode, setWorkMode] = useState("all");

  const filteredEntries = useMemo(() => {
    const sorted = [...activeEntries].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period === "all" ? 36500 : period));
    const cutoffValue = cutoff.toISOString().slice(0, 10);
    const normalized = query.trim().toLowerCase();
    return sorted.filter((entry) => {
      const inPeriod = period === "all" || entry.date >= cutoffValue;
      const inCategory = category === "all" || entry.category === category;
      const inMode = workMode === "all" || entry.workMode === workMode;
      const haystack = `${entry.project} ${entry.workDone} ${entry.learned} ${entry.tags.join(" ")}`.toLowerCase();
      return inPeriod && inCategory && inMode && (!normalized || haystack.includes(normalized));
    });
  }, [activeEntries, category, period, query, workMode]);

  const analytics = useMemo(() => {
    const shortDateFormatter = new Intl.DateTimeFormat(localeCode, {
      day: "2-digit",
      month: "short",
    });

    const timeline = filteredEntries.reduce<
      Array<{
        date: string;
        fullDate: string;
        hours: number;
        cumulative: number;
        target: number;
        mood: number;
        energy: number;
        focus: number;
        satisfaction: number;
        completedTasks: number;
        totalTasks: number;
      }>
    >((rows, entry) => {
      const cumulative = (rows.at(-1)?.cumulative || 0) + entry.hours;
      const parsedDate = parseLocalDate(entry.date);

      return [
        ...rows,
        {
          date: shortDateFormatter.format(parsedDate),
          fullDate: entry.date,
          hours: Number(entry.hours.toFixed(2)),
          cumulative: Number(cumulative.toFixed(2)),
          target: activeInternship.goalHours,
          mood: entry.mood,
          energy: entry.energy,
          focus: entry.focus,
          satisfaction: entry.satisfaction,
          completedTasks: entry.todos.filter((todo) => todo.done).length,
          totalTasks: entry.todos.length,
        },
      ];
    }, []);

    const total = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const average = filteredEntries.length ? total / filteredEntries.length : 0;
    const mood = filteredEntries.length
      ? filteredEntries.reduce((sum, entry) => sum + entry.mood, 0) /
        filteredEntries.length
      : 0;
    const focus = filteredEntries.length
      ? filteredEntries.reduce((sum, entry) => sum + entry.focus, 0) /
        filteredEntries.length
      : 0;
    const totalTasks = filteredEntries.reduce(
      (sum, entry) => sum + entry.todos.length,
      0,
    );
    const completedTasks = filteredEntries.reduce(
      (sum, entry) =>
        sum + entry.todos.filter((todo) => todo.done).length,
      0,
    );

    const categoryMap = new Map<string, number>();
    const workModeMap = new Map<string, number>();
    const weekdayMap = new Map<number, number>();
    const tags = new Map<string, number>();

    filteredEntries.forEach((entry) => {
      categoryMap.set(
        entry.category,
        (categoryMap.get(entry.category) || 0) + entry.hours,
      );
      workModeMap.set(
        entry.workMode,
        (workModeMap.get(entry.workMode) || 0) + entry.hours,
      );

      const weekday = parseLocalDate(entry.date).getDay();
      weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + entry.hours);
      entry.tags.forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));
    });

    const categoryLabels: Record<string, string> = fr
      ? {
          development: "Développement",
          design: "Design",
          analysis: "Analyse",
          testing: "Tests",
          support: "Support",
          meeting: "Réunions",
          learning: "Apprentissage",
          administration: "Administration",
          other: "Autre",
        }
      : {
          development: "Development",
          design: "Design",
          analysis: "Analysis",
          testing: "Testing",
          support: "Support",
          meeting: "Meetings",
          learning: "Learning",
          administration: "Administration",
          other: "Other",
        };

    const workModeLabels: Record<string, string> = fr
      ? { onsite: "Sur place", remote: "À distance", hybrid: "Hybride" }
      : { onsite: "On-site", remote: "Remote", hybrid: "Hybrid" };

    const weekdays = fr
      ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const wellbeing = filteredEntries.length
      ? filteredEntries.reduce((sum, entry) => sum + entry.mood + entry.energy + entry.focus + entry.satisfaction, 0) / (filteredEntries.length * 4)
      : 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;
    filteredEntries.forEach((entry) => {
      const date = parseLocalDate(entry.date);
      if (previousDate) {
        const difference = Math.round((date.getTime() - previousDate.getTime()) / 86400000);
        currentStreak = difference <= 3 ? currentStreak + 1 : 1;
      } else currentStreak = 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      previousDate = date;
    });
    const busiestWeekday = [...weekdayMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      timeline,
      total,
      average,
      mood,
      focus,
      taskRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
      wellbeing,
      longestStreak,
      busiestWeekday: busiestWeekday === undefined ? "—" : weekdays[busiestWeekday],
      categoryData: [...categoryMap.entries()]
        .map(([name, hours]) => ({
          name: categoryLabels[name] || name,
          hours: Number(hours.toFixed(2)),
        }))
        .sort((a, b) => b.hours - a.hours),
      workModeData: [...workModeMap.entries()].map(([name, hours]) => ({
        name: workModeLabels[name] || name,
        value: Number(hours.toFixed(2)),
      })),
      weekdayData: [1, 2, 3, 4, 5, 6, 0].map((day) => ({
        name: weekdays[day],
        hours: Number((weekdayMap.get(day) || 0).toFixed(2)),
      })),
      topTags: [...tags.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
    };
  }, [activeInternship.goalHours, filteredEntries, fr, localeCode]);

  const hourAxisFormatter = (value: number) =>
    `${new Intl.NumberFormat(localeCode, { maximumFractionDigits: 1 }).format(value)} h`;

  return (
    <>
      <PageHeader
        title={t(locale, "app.analytics.professional_analytics")}
        description={
          t(locale, "app.analytics.measure_pace_experience_quality_work_distribution_and_progress_toward_your_goals")
        }
      />
      <FilterPanel title={t(locale, "app.analytics.filters")} summary={t(locale, "app.analytics.filtered_days", { count: filteredEntries.length })} open={filtersOpen} onOpenChange={setFiltersOpen} onClear={() => { setPeriod("90"); setQuery(""); setCategory("all"); setWorkMode("all"); }} clearLabel={t(locale, "app.analytics.clear_filters")} className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, "app.analytics.search_placeholder")} />
          <Select value={period} onValueChange={setPeriod} options={[{value:"30",label:t(locale,"app.analytics.last_30_days")},{value:"90",label:t(locale,"app.analytics.last_90_days")},{value:"180",label:t(locale,"app.analytics.last_6_months")},{value:"all",label:t(locale,"app.analytics.all_time")}]}/>
          <Select value={category} onValueChange={setCategory} options={[{value:"all",label:t(locale,"app.analytics.all_categories")},{value:"development",label:t(locale,"app.analytics.category_development")},{value:"analysis",label:t(locale,"app.analytics.category_analysis")},{value:"testing",label:t(locale,"app.analytics.category_testing")},{value:"meeting",label:t(locale,"app.analytics.category_meeting")},{value:"learning",label:t(locale,"app.analytics.category_learning")},{value:"other",label:t(locale,"app.analytics.category_other")}]}/>
          <Select value={workMode} onValueChange={setWorkMode} options={[{value:"all",label:t(locale,"app.analytics.all_work_modes")},{value:"onsite",label:t(locale,"app.analytics.mode_onsite")},{value:"remote",label:t(locale,"app.analytics.mode_remote")},{value:"hybrid",label:t(locale,"app.analytics.mode_hybrid")}]}/>
        </div>
      </FilterPanel>

      {analytics.timeline.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Clock3}
              label={t(locale, "app.analytics.documented_hours")}
              value={formatHours(analytics.total)}
            />
            <Stat
              icon={Activity}
              label={t(locale, "app.analytics.average_per_day")}
              value={formatHours(analytics.average)}
            />
            <Stat
              icon={Smile}
              label={t(locale, "app.analytics.average_mood")}
              value={`${analytics.mood.toFixed(1)}/5`}
            />
            <Stat
              icon={Brain}
              label={t(locale, "app.analytics.focus")}
              value={`${analytics.focus.toFixed(1)}/5`}
            />
            <Stat icon={ListChecks} label={t(locale, "app.analytics.tasks_completed")} value={`${Math.round(analytics.taskRate)}%`} />
            <Stat icon={Smile} label={t(locale, "app.analytics.wellbeing_index")} value={`${analytics.wellbeing.toFixed(1)}/5`} />
            <Stat icon={Activity} label={t(locale, "app.analytics.longest_streak")} value={t(locale, "app.analytics.days_count", { count: analytics.longestStreak })} />
            <Stat icon={CalendarDays} label={t(locale, "app.analytics.busiest_weekday")} value={analytics.busiestWeekday} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <ChartCard
              title={t(locale, "app.analytics.hours_per_day")}
              description={
                t(locale, "app.analytics.spot_unusually_heavy_or_under_documented_days")
              }
              icon={<BarChart3 className="size-5 text-primary" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.timeline}>
                  <Grid />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={hourAxisFormatter} />
                  <ChartTooltip locale={locale} kind="hours" />
                  <Bar
                    dataKey="hours"
                    name={t(locale, "app.analytics.hours")}
                    fill="var(--primary)"
                    radius={[6, 6, 2, 2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t(locale, "app.analytics.cumulative_progress")}
              description={
                fr
                  ? `Objectif actuel : ${activeInternship.goalHours} heures.`
                  : `Current target: ${activeInternship.goalHours} hours.`
              }
              icon={<Target className="size-5 text-success" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline}>
                  <defs>
                    <linearGradient
                      id="hoursArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--primary)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--primary)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <Grid />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={hourAxisFormatter} />
                  <ChartTooltip locale={locale} kind="hours" />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name={t(locale, "app.analytics.cumulative")}
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fill="url(#hoursArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t(locale, "app.analytics.experience_quality")}
              description={
                t(locale, "app.analytics.mood_energy_focus_and_satisfaction_on_the_same_scale")
              }
              icon={<Brain className="size-5 text-warning" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeline}>
                  <Grid />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis domain={[1, 5]} {...axisProps} />
                  <ChartTooltip locale={locale} kind="rating" />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    name={t(locale, "app.analytics.mood")}
                    stroke="var(--primary)"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name={t(locale, "app.analytics.energy")}
                    stroke="var(--warning)"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="focus"
                    name={t(locale, "app.analytics.focus")}
                    stroke="var(--success)"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="satisfaction"
                    name={t(locale, "app.analytics.satisfaction")}
                    stroke="var(--secondary)"
                    strokeWidth={2.2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={
                t(locale, "app.analytics.hours_by_weekday")
              }
              description={
                t(locale, "app.analytics.understand_your_usual_weekly_pace")
              }
              icon={<Clock3 className="size-5 text-info" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.weekdayData}>
                  <Grid />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={hourAxisFormatter} />
                  <ChartTooltip locale={locale} kind="hours" />
                  <Bar
                    dataKey="hours"
                    name={t(locale, "app.analytics.hours")}
                    fill="var(--secondary)"
                    radius={[6, 6, 2, 2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t(locale, "app.analytics.category_breakdown")}
              description={
                t(locale, "app.analytics.see_which_activities_actually_shape_your_internship")
              }
              icon={<BriefcaseBusiness className="size-5 text-primary" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.categoryData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <Grid />
                  <XAxis
                    type="number"
                    {...axisProps}
                    tickFormatter={hourAxisFormatter}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={105}
                    {...axisProps}
                  />
                  <ChartTooltip locale={locale} kind="hours" />
                  <Bar
                    dataKey="hours"
                    name={t(locale, "app.analytics.hours")}
                    fill="var(--primary)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title={t(locale, "app.analytics.work_mode")}
              description={
                t(locale, "app.analytics.time_split_between_on_site_remote_and_hybrid_work")
              }
              icon={<BriefcaseBusiness className="size-5 text-secondary" />}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.workModeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {analytics.workModeData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip locale={locale} kind="hours" />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <Card className="mt-5">
            <CardHeader>
              <div>
                <h2 className="text-lg font-bold">
                  {t(locale, "app.analytics.most_used_skills")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {t(locale, "app.analytics.frequency_of_technologies_and_skills_associated_with_filtered_entries")}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {analytics.topTags.length ? (
                  analytics.topTags.map(([tag, count], index) => (
                    <div
                      key={tag}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate font-bold">{tag}</div>
                        <span className="rounded-full bg-primary-softer px-2 py-1 text-xs font-bold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted">
                        {count} {t(locale, "app.analytics.use_s")}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    {t(locale, "app.analytics.no_tagged_skills_in_this_period")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title={t(locale, "app.analytics.analytics_waiting")}
          description={
            t(locale, "app.analytics.add_a_few_detailed_days_to_generate_useful_trends")
          }
        />
      )}
    </>
  );
}

const axisProps = {
  tick: { fill: "var(--muted)", fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;

function Grid() {
  return (
    <CartesianGrid
      stroke="var(--border)"
      vertical={false}
      strokeDasharray="3 3"
    />
  );
}

function ChartTooltip({
  locale,
  kind,
}: {
  locale: string;
  kind: TooltipKind;
}) {
  const localeCode = localeTag(locale);

  return (
    <Tooltip
      contentStyle={{
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--foreground)",
        boxShadow: "var(--shadow-soft)",
        padding: "11px 13px",
      }}
      labelStyle={{
        color: "var(--muted-strong)",
        fontWeight: 700,
        marginBottom: 6,
      }}
      formatter={(value, name) => {
        const numericValue = Number(
          Array.isArray(value) ? value[0] : value,
        );
        const localizedName = localizeMetricName(String(name ?? ""), locale);

        if (kind === "hours") {
          return [formatHours(numericValue), localizedName];
        }

        if (kind === "rating") {
          return [
            `${new Intl.NumberFormat(localeCode, {
              maximumFractionDigits: 1,
            }).format(numericValue)} / 5`,
            localizedName,
          ];
        }

        return [
          new Intl.NumberFormat(localeCode, {
            maximumFractionDigits: 2,
          }).format(numericValue),
          localizedName,
        ];
      }}
      labelFormatter={(label, payload) => {
        const firstItem = payload?.[0] as TooltipPayloadItem | undefined;
        const fullDate = firstItem?.payload?.fullDate;

        if (fullDate) {
          return new Intl.DateTimeFormat(localeCode, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(parseLocalDate(fullDate));
        }

        return String(label ?? "");
      }}
    />
  );
}

function localizeMetricName(name: string, locale: string) {
  const normalized = name.trim().toLowerCase();
  const keys: Record<string, string> = {
    hours: "metric_hours",
    heures: "metric_hours",
    cumulative: "metric_cumulative",
    cumul: "metric_cumulative",
    mood: "metric_mood",
    humeur: "metric_mood",
    energy: "metric_energy",
    énergie: "metric_energy",
    focus: "metric_focus",
    concentration: "metric_focus",
    satisfaction: "metric_satisfaction",
  };
  const key = keys[normalized];
  return key ? t(locale, `app.analytics.${key}`) : name;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
            <Icon className="size-4.5" />
          </span>
        </div>
        <div className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-muted">
          {label}
        </div>
        <div className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="h-80">{children}</div>
      </CardContent>
    </Card>
  );
}
