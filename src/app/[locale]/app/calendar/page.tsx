"use client";

import { translate as t } from "@/i18n";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { enCA, frCA } from "date-fns/locale";
import {
  CalendarCheck2,
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { holidayForDate } from "@/lib/holidays";
import { useStageLog } from "@/lib/store";
import type { JournalCategory, JournalEntry } from "@/lib/types";
import { formatHours } from "@/lib/utils";

const CATEGORY_STYLES: Record<
  JournalCategory,
  { dot: string; card: string; border: string }
> = {
  development: {
    dot: "bg-[#2f6f9f]",
    card: "bg-[#e6f1f8] text-[#174d73]",
    border: "border-l-[#2f6f9f]",
  },
  design: {
    dot: "bg-[#7a5ca8]",
    card: "bg-[#f0ebf7] text-[#5d408b]",
    border: "border-l-[#7a5ca8]",
  },
  analysis: {
    dot: "bg-[#287e8f]",
    card: "bg-[#e5f3f4] text-[#1f6673]",
    border: "border-l-[#287e8f]",
  },
  testing: {
    dot: "bg-[#b57a22]",
    card: "bg-[#f8f0e2] text-[#825513]",
    border: "border-l-[#b57a22]",
  },
  support: {
    dot: "bg-[#397d6d]",
    card: "bg-[#e7f3ef] text-[#285f52]",
    border: "border-l-[#397d6d]",
  },
  meeting: {
    dot: "bg-[#b35f3d]",
    card: "bg-[#f8ece7] text-[#87452d]",
    border: "border-l-[#b35f3d]",
  },
  learning: {
    dot: "bg-[#52824b]",
    card: "bg-[#ebf4e8] text-[#3d6538]",
    border: "border-l-[#52824b]",
  },
  administration: {
    dot: "bg-[#64748b]",
    card: "bg-[#edf1f5] text-[#475569]",
    border: "border-l-[#64748b]",
  },
  other: {
    dot: "bg-[#7b8794]",
    card: "bg-[#eef1f3] text-[#56616c]",
    border: "border-l-[#7b8794]",
  },
};

export default function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const fr = locale !== "en";
  const dateLocale = fr ? frCA : enCA;
  const { activeEntries, data } = useStageLog();
  const settings = data.settings;
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), {
          weekStartsOn: settings.weekStartsOn,
        }),
        end: endOfWeek(endOfMonth(cursor), {
          weekStartsOn: settings.weekStartsOn,
        }),
      }),
    [cursor, settings.weekStartsOn],
  );

  const categoryLabels: Record<JournalCategory, string> = {
    development: t(locale, "app.calendar.development"),
    design: t(locale, "app.calendar.design"),
    analysis: t(locale, "app.calendar.analysis"),
    testing: t(locale, "app.calendar.testing_and_qa"),
    support: t(locale, "app.calendar.support"),
    meeting: t(locale, "app.calendar.meeting"),
    learning: t(locale, "app.calendar.learning"),
    administration: t(locale, "app.calendar.administration"),
    other: t(locale, "app.calendar.other"),
  };

  const filteredEntries = useMemo(
    () =>
      activeEntries.filter(
        (entry) =>
          categoryFilter === "all" || entry.category === categoryFilter,
      ),
    [activeEntries, categoryFilter],
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of filteredEntries) {
      const current = map.get(entry.date) ?? [];
      current.push(entry);
      map.set(
        entry.date,
        current.sort((left, right) => left.start.localeCompare(right.start)),
      );
    }
    return map;
  }, [filteredEntries]);

  const monthEntries = useMemo(
    () =>
      filteredEntries
        .filter((entry) =>
          isSameMonth(parseISO(`${entry.date}T12:00:00`), cursor),
        )
        .sort(
          (left, right) =>
            left.date.localeCompare(right.date) ||
            left.start.localeCompare(right.start),
        ),
    [cursor, filteredEntries],
  );

  const groupedMobileEntries = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const entry of monthEntries)
      map.set(entry.date, [...(map.get(entry.date) || []), entry]);
    return [...map.entries()];
  }, [monthEntries]);

  const selectedEntries = selectedDate
    ? (entriesByDate.get(selectedDate) ?? [])
    : [];
  const selectedDateValue = selectedDate
    ? new Date(`${selectedDate}T12:00:00`)
    : null;
  const monthHours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(2026, 0, 5), {
      weekStartsOn: settings.weekStartsOn,
    });
    return Array.from({ length: 7 }, (_, index) =>
      format(
        new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + index,
        ),
        "EEE",
        { locale: dateLocale },
      ),
    );
  }, [dateLocale, settings.weekStartsOn]);

  return (
    <>
      <PageHeader
        title={t(locale, "app.calendar.calendar")}
        description={t(
          locale,
          "app.calendar.view_logged_days_their_categories_and_periods_that_are_still_incomplete",
        )}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="w-48">
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                startIcon={<Filter className="size-4" />}
                options={[
                  {
                    value: "all",
                    label: t(locale, "app.calendar.all_categories"),
                  },
                  ...Object.entries(categoryLabels).map(([value, label]) => ({
                    value,
                    label,
                  })),
                ]}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCursor(startOfMonth(new Date()))}
            >
              {t(locale, "app.calendar.today")}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-strong">
            <span className="inline-flex items-center gap-2">
              <CalendarCheck2 className="size-4 text-primary" />
              <strong className="text-foreground">{monthEntries.length}</strong>
              {t(locale, "app.calendar.entries")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-primary" />
              <strong className="text-foreground">
                {formatHours(monthHours)}
              </strong>
              {t(locale, "app.calendar.logged")}
            </span>
            {settings.holidayCalendar ? (
              <span className="inline-flex items-center gap-2">
                <CalendarHeart className="size-4 text-primary" />
                {t(locale, "app.calendar.holidays_enabled")}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCursor(subMonths(cursor, 1))}
              aria-label={t(locale, "app.calendar.previous_month")}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="min-w-38 text-center text-sm font-extrabold capitalize">
              {format(cursor, "MMMM yyyy", { locale: dateLocale })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label={t(locale, "app.calendar.next_month")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)] md:block">
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted/55">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="px-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted sm:text-xs"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const entries = entriesByDate.get(key) ?? [];
            const currentMonth = isSameMonth(day, cursor);
            const today = isToday(day);
            const weekend = isWeekend(day);
            const holiday = settings.holidayCalendar
              ? holidayForDate(day, settings.country, settings.region, locale)
              : undefined;

            return (
              <div
                key={key}
                className={`min-h-24 border-r border-b border-border p-1.5 transition-colors duration-150 xl:min-h-27 xl:p-2 ${currentMonth ? (weekend ? "bg-surface-muted/32" : "bg-surface") : "bg-surface-muted/52 text-muted"} ${today ? "relative z-[1] ring-2 ring-inset ring-primary/55" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-extrabold ${today ? "bg-primary text-white" : "text-foreground"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {entries.length ? (
                    <span className="text-[10px] font-extrabold text-muted">
                      {formatHours(
                        entries.reduce((sum, entry) => sum + entry.hours, 0),
                      )}
                    </span>
                  ) : null}
                </div>
                {holiday ? (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    data-tooltip={holiday.name}
                    className="mt-1 block max-w-full truncate rounded-md bg-warning/10 px-1.5 py-0.5 text-left text-[8px] font-extrabold text-warning"
                  >
                    {holiday.name}
                  </button>
                ) : null}
                <div className="mt-1 space-y-1">
                  {entries.slice(0, 2).map((entry) => {
                    const style = CATEGORY_STYLES[entry.category];
                    const summary =
                      entry.project ||
                      entry.workDone ||
                      categoryLabels[entry.category];
                    return (
                      <Link
                        key={entry.id}
                        href={`/${locale}/app/journal/edit/${entry.id}`}
                        data-tooltip={`${entry.start}–${entry.end} · ${formatHours(entry.hours)} · ${summary}`}
                        className={`flex min-h-7 items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-[9px] leading-3 transition-colors duration-150 hover:brightness-[0.98] xl:text-[10px] ${style.card} ${style.border}`}
                      >
                        <span className="shrink-0 font-extrabold">{entry.start}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{summary}</span>
                      </Link>
                    );
                  })}
                  {entries.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(key)}
                      className="w-full rounded-md px-1 py-1 text-left text-[10px] font-extrabold text-primary hover:bg-primary-softer"
                    >
                      + {entries.length - 2} {t(locale, "app.calendar.more")}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {groupedMobileEntries.length ? (
          groupedMobileEntries.map(([date, entries]) => {
            const dateValue = parseISO(`${date}T12:00:00`);
            const holiday = settings.holidayCalendar
              ? holidayForDate(
                  dateValue,
                  settings.country,
                  settings.region,
                  locale,
                )
              : undefined;
            return (
              <Card key={date}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <div className="text-sm font-extrabold capitalize text-foreground">
                        {format(dateValue, "EEEE d MMMM", {
                          locale: dateLocale,
                        })}
                      </div>
                      {holiday ? (
                        <div className="mt-1 text-xs font-bold text-warning">
                          {holiday.name}
                        </div>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-extrabold text-primary">
                      {formatHours(
                        entries.reduce((sum, entry) => sum + entry.hours, 0),
                      )}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {entries.map((entry) => {
                      const style = CATEGORY_STYLES[entry.category];
                      return (
                        <Link
                          key={entry.id}
                          href={`/${locale}/app/journal/edit/${entry.id}`}
                          className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
                        >
                          <span
                            className={`mt-1 size-2.5 shrink-0 rounded-full ${style.dot}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold text-primary">
                                {entry.start}–{entry.end}
                              </span>
                              <span className="text-xs font-bold text-muted">
                                {formatHours(entry.hours)}
                              </span>
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm font-bold text-foreground">
                              {entry.project ||
                                entry.workDone ||
                                categoryLabels[entry.category]}
                            </div>
                            {entry.location ? (
                              <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                                <MapPin className="size-3" />
                                {entry.location}
                              </div>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            {t(locale, "app.calendar.no_entries_logged_for_this_month")}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDateValue
            ? format(selectedDateValue, "EEEE d MMMM yyyy", {
                locale: dateLocale,
              })
            : t(locale, "app.calendar.calendar")
        }
        description={
          selectedDateValue && settings.holidayCalendar
            ? holidayForDate(
                selectedDateValue,
                settings.country,
                settings.region,
                locale,
              )?.name
            : undefined
        }
        size="lg"
      >
        <div className="space-y-3">
          {selectedEntries.length ? (
            selectedEntries.map((entry) => {
              const style = CATEGORY_STYLES[entry.category];
              return (
                <Link
                  key={entry.id}
                  href={`/${locale}/app/journal/edit/${entry.id}`}
                  onClick={() => setSelectedDate(null)}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/35"
                >
                  <span
                    className={`mt-1 size-3 shrink-0 rounded-full ${style.dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-foreground">
                        {entry.start}–{entry.end}
                      </span>
                      <span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">
                        {formatHours(entry.hours)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.card}`}
                      >
                        {categoryLabels[entry.category]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-strong">
                      {entry.workDone || entry.project}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              {t(locale, "app.calendar.no_entries_for_day")}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
