"use client";

import { translate as t } from "@/i18n";
import { use, useEffect, useMemo, useState } from "react";
import { BarChart3, Search, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { useStageLog } from "@/lib/store";

export default function SkillsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { activeEntries, data } = useStageLog();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(
    data.settings.defaultPageSize,
  );

  const skills = useMemo(() => {
    const names = activeEntries.flatMap((entry) => entry.tags);
    const map = new Map<string, { count: number; hours: number }>();
    for (const entry of activeEntries) {
      for (const raw of entry.tags) {
        const name = raw.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const current = map.get(key) || { count: 0, hours: 0 };
        map.set(key, {
          count: current.count + 1,
          hours: current.hours + entry.hours,
        });
      }
    }
    const normalizedQuery = query.trim().toLowerCase();
    return [...map.entries()]
      .map(([key, value]) => ({
        key,
        name: names.find((tag) => tag.toLowerCase() === key) || key,
        ...value,
      }))
      .filter(
        (skill) =>
          !normalizedQuery ||
          skill.name.toLowerCase().includes(normalizedQuery),
      )
      .sort(
        (a, b) =>
          b.count - a.count ||
          b.hours - a.hours ||
          a.name.localeCompare(b.name),
      );
  }, [activeEntries, query]);

  useEffect(() => setPage(1), [query]);

  const max = Math.max(1, ...skills.map((skill) => skill.count));
  const paginatedSkills = skills.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHeader
        title={t(locale, "app.skills.skills")}
        description={t(
          locale,
          "app.skills.skills_and_technologies_are_generated_from_tags_used_in_your_journal",
        )}
      />
      {activeEntries.length ? (
        <Card className="mb-5">
          <CardContent className="py-4">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10"
                placeholder={t(locale, "app.skills.search_skills")}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {skills.length ? (
        <Pagination
          locale={locale}
          page={page}
          pageSize={pageSize}
          total={skills.length}
          className="mb-4"
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      ) : null}
      {skills.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedSkills.map((skill) => (
            <Card key={skill.key}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold">
                      {skill.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {skill.count} {t(locale, "app.skills.day_s")} ·{" "}
                      {skill.hours.toFixed(1)}{" "}
                      {t(locale, "common.misc.hour_short")}
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Sparkles className="size-4.5" />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-strong">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(skill.count / max) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BarChart3}
          title={
            query
              ? t(locale, "app.skills.no_matching_skill")
              : t(locale, "app.skills.no_skills_detected")
          }
          description={
            query
              ? t(locale, "app.skills.try_another_search")
              : t(
                  locale,
                  "app.skills.add_skills_or_technologies_to_entries_to_build_this_view",
                )
          }
        />
      )}
    </>
  );
}
