"use client";

import { translate as t, supportedLocales } from "@/i18n";
import { useState, useTransition } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  ar: "العربية",
};

export function LanguageSwitcher({
  locale,
  compact = false,
  inverted = false,
}: {
  locale: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function switchLanguage(target: string) {
    const nextPath = /^\/(fr|en|es|pt|de|it|ar)(?=\/|$)/.test(pathname)
      ? pathname.replace(/^\/(fr|en|es|pt|de|it|ar)(?=\/|$)/, `/${target}`)
      : `/${target}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    const query = typeof window !== "undefined" ? window.location.search : "";
    setOpen(false);
    startTransition(() => router.push(`${nextPath}${query}`));
  }

  return (
    <div className="relative z-[520]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={pending}
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors duration-150 disabled:opacity-55",
          inverted
            ? "border-white/12 bg-white/7 text-white/75 hover:bg-white/12 hover:text-white"
            : "border-border bg-surface text-muted-strong hover:border-primary/35 hover:bg-primary-softer hover:text-primary",
          compact && "size-10 px-0",
        )}
        aria-label={t(locale, "common.language-switcher.select_language")}
        aria-expanded={open}
      >
        <Languages className="size-4" aria-hidden />
        {compact ? null : <span>{LABELS[locale] || locale.toUpperCase()}</span>}
        {compact ? null : <ChevronDown className="size-3.5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[510] cursor-default"
            aria-label={t(locale, "common.language-switcher.select_language")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 top-12 z-[530] w-52 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-float)]">
            {supportedLocales.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchLanguage(item)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm font-semibold transition-colors",
                  item === locale
                    ? "bg-primary-softer text-primary"
                    : "text-muted-strong hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <span>{LABELS[item]}</span>
                {item === locale ? <Check className="size-4" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
