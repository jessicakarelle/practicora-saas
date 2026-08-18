"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function SuggestionInput({
  value,
  onChange,
  suggestions,
  placeholder,
  ariaLabel,
  startIcon,
  recentLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  ariaLabel?: string;
  startIcon?: ReactNode;
  recentLabel: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const query = value.trim().toLowerCase();
    return [...new Set(suggestions.map((item) => item.trim()).filter(Boolean))]
      .filter((item) => !query || item.toLowerCase().includes(query))
      .filter((item) => item.toLowerCase() !== query)
      .slice(0, 7);
  }, [suggestions, value]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {startIcon ? <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted">{startIcon}</span> : null}
      <Input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        placeholder={placeholder}
        className={cn(startIcon && "pl-10")}
      />
      {open && options.length ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-float)]">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
            <Clock3 className="size-3.5" />
            {recentLabel}
          </div>
          <div role="listbox" className="max-h-60 overflow-y-auto practicora-scroll">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-muted-strong transition-colors hover:bg-primary-softer hover:text-primary"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                <span className="truncate">{option}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
