"use client";

import { translate as t } from "@/i18n";

import { use, useMemo } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { frCA, enCA } from "date-fns/locale";
import { CalendarCheck2, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useStageLog } from "@/lib/store";
import { formatHours } from "@/lib/utils";

export default function WeekPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const fr = locale !== "en";
  const { activeEntries, activeInternship } = useStageLog();
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const weekEntries = useMemo(
    () =>
      activeEntries.filter((entry) =>
        days.some((day) => entry.date === format(day, "yyyy-MM-dd")),
      ),
    [activeEntries, days],
  );
  const total = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const progress = Math.min(
    100,
    activeInternship.weeklyGoalHours
      ? (total / activeInternship.weeklyGoalHours) * 100
      : 0,
  );

  return (
    <>
      <PageHeader
        title={t(locale, "app.week.this_week")}
        description={t(
          locale,
          "app.week.a_simple_view_of_your_pace_logged_days_and_weekly_target",
        )}
      />
      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-muted">
                {t(locale, "app.week.weekly_progress")}
              </div>
              <div className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">
                {formatHours(total)}{" "}
                <span className="text-base font-semibold text-muted">
                  / {formatHours(activeInternship.weeklyGoalHours)}
                </span>
              </div>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Clock3 className="size-5" />
            </div>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-surface-strong">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
      <div className="mt-5 grid items-start gap-2.5 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => {
          const date = format(day, "yyyy-MM-dd");
          const entry = weekEntries.find((item) => item.date === date);
          return (
            <Card key={date} className={entry ? "border-primary/30" : ""}>
              <CardContent className="p-3.5">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  {format(day, "EEE", { locale: fr ? frCA : enCA })}
                </div>
                <div className="mt-1 text-lg font-extrabold">
                  {format(day, "d")}
                </div>
                {entry ? (
                  <>
                    <div className="mt-3 text-sm font-bold text-primary">
                      {formatHours(entry.hours)}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">
                      {entry.workDone}
                    </p>
                  </>
                ) : (
                  <div className="mt-3 text-xs text-muted">
                    {t(locale, "app.week.not_logged")}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {weekEntries.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={CalendarCheck2}
            title={t(locale, "app.week.no_entries_this_week")}
            description={t(
              locale,
              "app.week.add_a_day_to_begin_weekly_tracking",
            )}
          />
        </div>
      ) : null}
    </>
  );
}
