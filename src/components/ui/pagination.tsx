"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { translate as t } from "@/i18n";
import { cn } from "@/lib/utils";

export function Pagination({
  locale,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: {
  locale: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = total ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(total, safePage * pageSize);

  if (total <= pageSizeOptions[0] && pageSize === pageSizeOptions[0])
    return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs font-semibold text-muted-strong sm:text-sm">
        {t(locale, "common.pagination.range", { start, end, total })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-32">
          <Select
            value={String(pageSize)}
            ariaLabel={t(locale, "common.pagination.items_per_page")}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map((size) => ({
              value: String(size),
              label: t(locale, "common.pagination.items", { count: size }),
            }))}
          />
        </div>
        <span className="min-w-20 text-center text-xs font-bold text-foreground sm:text-sm">
          {t(locale, "common.pagination.page_of", {
            page: safePage,
            pages: pageCount,
          })}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="size-9 px-0"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label={t(locale, "common.pagination.previous")}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="size-9 px-0"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          aria-label={t(locale, "common.pagination.next")}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
