"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Edit3,
  Filter,
  Paperclip,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { useDialog } from "@/components/ui/dialog-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { useStageLog } from "@/lib/store";
import type { JournalEntry } from "@/lib/types";
import { formatHours } from "@/lib/utils";

export default function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const dialog = useDialog();
  const { activeEntries, deleteEntry, data } = useStageLog();
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("all");
  const [workMode, setWorkMode] = useState("all");
  const [mood, setMood] = useState("all");
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(
    data.settings.defaultPageSize,
  );

  const categoryOptions = [
    { value: "all", label: t(locale, "app.journal.all_categories") },
    { value: "development", label: t(locale, "app.journal.development") },
    { value: "design", label: t(locale, "common.misc.design") },
    { value: "analysis", label: t(locale, "app.journal.analysis") },
    { value: "testing", label: t(locale, "app.journal.testing_and_qa") },
    { value: "support", label: t(locale, "common.misc.support") },
    { value: "meeting", label: t(locale, "app.journal.meeting") },
    { value: "learning", label: t(locale, "app.journal.learning") },
    { value: "administration", label: t(locale, "common.misc.administration") },
    { value: "other", label: t(locale, "app.journal.other") },
  ];

  const entries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = activeEntries.filter((entry) => {
      const searchable = [
        entry.project,
        entry.workDone,
        entry.achievements,
        entry.learned,
        entry.difficulties,
        entry.feedback,
        entry.nextSteps,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!from || entry.date >= from) &&
        (!to || entry.date <= to) &&
        (category === "all" || entry.category === category) &&
        (workMode === "all" || entry.workMode === workMode) &&
        (mood === "all" || entry.mood === Number(mood))
      );
    });
    return result.sort((a, b) => {
      if (sort === "oldest") return a.date.localeCompare(b.date);
      if (sort === "hours-desc") return b.hours - a.hours;
      if (sort === "hours-asc") return a.hours - b.hours;
      return b.date.localeCompare(a.date);
    });
  }, [activeEntries, category, from, mood, query, sort, to, workMode]);

  useEffect(() => {
    setPage(1);
  }, [category, from, mood, query, sort, to, workMode]);

  const activeFilterCount = [
    from,
    to,
    category !== "all",
    workMode !== "all",
    mood !== "all",
  ].filter(Boolean).length;
  const paginatedEntries = entries.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  function resetFilters() {
    setQuery("");
    setFrom("");
    setTo("");
    setCategory("all");
    setWorkMode("all");
    setMood("all");
    setSort("newest");
  }

  async function removeEntry(entry: JournalEntry) {
    const accepted = await dialog.confirm({
      title: t(locale, "app.journal.move_this_day_to_trash"),
      description: new Intl.DateTimeFormat(t(locale, "app.journal.en_ca"), {
        dateStyle: "full",
      }).format(new Date(`${entry.date}T12:00:00`)),
      tone: "danger",
      confirmLabel: t(locale, "app.journal.move"),
      cancelLabel: t(locale, "app.journal.cancel"),
    });
    if (accepted) deleteEntry(entry.id);
  }

  return (
    <>
      <PageHeader
        title={t(locale, "app.journal.journal_history")}
        description={t(
          locale,
          "app.journal.search_filter_and_sort_every_entry_without_losing_professional_context",
        )}
      />
      <Card className="mb-4">
        <CardContent className="space-y-3 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10"
                placeholder={t(
                  locale,
                  "app.journal.search_a_project_skill_or_outcome",
                )}
              />
            </div>
            <Select
              value={sort}
              onValueChange={setSort}
              options={[
                { value: "newest", label: t(locale, "app.journal.newest") },
                { value: "oldest", label: t(locale, "app.journal.oldest") },
                {
                  value: "hours-desc",
                  label: t(locale, "app.journal.most_hours"),
                },
                {
                  value: "hours-asc",
                  label: t(locale, "app.journal.fewest_hours"),
                },
              ]}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              className="justify-between lg:min-w-36"
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="size-4" />
                {filtersOpen
                  ? t(locale, "app.journal.hide_filters")
                  : t(locale, "app.journal.show_filters")}
                {activeFilterCount ? (
                  <span className="rounded-full bg-primary-softer px-1.5 py-0.5 text-[10px] font-extrabold text-primary">
                    {activeFilterCount}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${filtersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 xl:grid-cols-[160px_160px_220px_200px_180px_auto]">
                <DatePicker
                  value={from}
                  onChange={setFrom}
                  locale={locale}
                  ariaLabel={t(locale, "app.journal.start_date")}
                  placeholder={t(locale, "app.journal.from")}
                  max={to || undefined}
                />
                <DatePicker
                  value={to}
                  onChange={setTo}
                  locale={locale}
                  ariaLabel={t(locale, "app.journal.end_date")}
                  placeholder={t(locale, "app.journal.to")}
                  min={from || undefined}
                />
                <Select
                  value={category}
                  onValueChange={setCategory}
                  options={categoryOptions}
                />
                <Select
                  value={workMode}
                  onValueChange={setWorkMode}
                  options={[
                    {
                      value: "all",
                      label: t(locale, "app.journal.all_work_modes"),
                    },
                    {
                      value: "onsite",
                      label: t(locale, "app.journal.on_site"),
                    },
                    {
                      value: "remote",
                      label: t(locale, "app.journal.remote"),
                    },
                    {
                      value: "hybrid",
                      label: t(locale, "app.journal.hybrid"),
                    },
                  ]}
                />
                <Select
                  value={mood}
                  onValueChange={setMood}
                  options={[
                    {
                      value: "all",
                      label: t(locale, "app.journal.all_moods"),
                    },
                    ...[1, 2, 3, 4, 5].map((value) => ({
                      value: String(value),
                      label: `${value}/5`,
                    })),
                  ]}
                />
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="justify-self-start"
                >
                  <X className="size-4" />
                  {t(locale, "app.journal.reset_filters", {
                    count: activeFilterCount ? ` (${activeFilterCount})` : "",
                  })}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {entries.length ? (
        <Pagination
          locale={locale}
          page={page}
          pageSize={pageSize}
          total={entries.length}
          className="mb-4"
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      ) : null}
      {entries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t(locale, "app.journal.no_day_found")}
          description={
            activeEntries.length
              ? t(locale, "app.journal.change_filters_to_broaden_results")
              : t(
                  locale,
                  "app.journal.add_your_first_day_to_build_your_history",
                )
          }
          action={
            !activeEntries.length ? (
              <ButtonLink href={`/${locale}/app/journal/new`}>
                {t(locale, "app.journal.create_entry")}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {paginatedEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-softer text-primary">
                  <span className="text-lg font-extrabold leading-none">
                    {new Date(`${entry.date}T12:00:00`).getDate()}
                  </span>
                  <span className="mt-1 text-[10px] font-extrabold uppercase">
                    {new Intl.DateTimeFormat(t(locale, "app.journal.en_ca"), {
                      month: "short",
                    }).format(new Date(`${entry.date}T12:00:00`))}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-foreground">
                      {entry.project ||
                        new Intl.DateTimeFormat(
                          t(locale, "app.journal.en_ca"),
                          { dateStyle: "full" },
                        ).format(new Date(`${entry.date}T12:00:00`))}
                    </h2>
                    <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      {formatHours(entry.hours)}
                    </span>
                    <span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">
                      {
                        categoryOptions.find(
                          (option) => option.value === entry.category,
                        )?.label
                      }
                    </span>
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-strong">
                      {entry.workMode === "onsite"
                        ? t(locale, "app.journal.on_site")
                        : entry.workMode === "remote"
                          ? t(locale, "app.journal.remote")
                          : t(locale, "app.journal.hybrid")}
                    </span>
                    {entry.attachments.length ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-strong">
                        <Paperclip className="size-3" />
                        {entry.attachments.length}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-strong">
                    {entry.workDone}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>
                      {new Intl.DateTimeFormat(t(locale, "app.journal.en_ca"), {
                        dateStyle: "medium",
                      }).format(new Date(`${entry.date}T12:00:00`))}
                    </span>
                    <span>•</span>
                    <span>
                      {t(locale, "app.journal.mood")}: {entry.mood}/5
                    </span>
                    <span>•</span>
                    <span>
                      {t(locale, "app.journal.focus")}: {entry.focus}/5
                    </span>
                  </div>
                  {entry.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted-strong"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <ButtonLink
                    href={`/${locale}/app/journal/edit/${entry.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    <Edit3 className="size-4" />
                    <span className="hidden sm:inline">
                      {t(locale, "app.journal.edit")}
                    </span>
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeEntry(entry)}
                    aria-label={t(locale, "app.journal.move_to_trash")}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
