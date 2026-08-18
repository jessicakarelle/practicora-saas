"use client";

import { SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FilterPanel({ title, summary, open, onOpenChange, onClear, clearLabel, children, className }: { title: string; summary?: string; open: boolean; onOpenChange: (open: boolean) => void; onClear?: () => void; clearLabel?: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]", className)}>
    <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <button type="button" onClick={() => onOpenChange(!open)} className="group flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary transition-colors group-hover:bg-primary-soft"><SlidersHorizontal className="size-4" /></span>
        <span className="min-w-0"><span className="block text-sm font-extrabold">{title}</span>{summary ? <span className="mt-0.5 block truncate text-xs text-muted">{summary}</span> : null}</span>
        <ChevronDown className={cn("ml-auto size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      {onClear ? <Button type="button" variant="ghost" size="sm" onClick={onClear}><RotateCcw className="size-4" /><span className="hidden sm:inline">{clearLabel}</span></Button> : null}
    </div>
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="overflow-hidden"><div className="border-t border-border px-4 py-4 sm:px-5">{children}</div></div></div>
  </section>;
}
