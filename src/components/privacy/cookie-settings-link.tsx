"use client";

import { Cookie } from "lucide-react";
import { translate as t } from "@/i18n";
import { cn } from "@/lib/utils";

export const OPEN_COOKIE_SETTINGS_EVENT = "practicora:open-cookie-settings";

export function CookieSettingsLink({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "mt-4 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-muted-strong transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15",
        className,
      )}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))}
    >
      <Cookie className="size-4" aria-hidden />
      {t(locale, "marketing.cookies.manage")}
    </button>
  );
}
