"use client";

import { useParams } from "next/navigation";
import { translate as t } from "@/i18n";

export default function WorkspaceLoading() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale || "fr";

  return (
    <div className="animate-pulse space-y-5" aria-label={t(locale, "common.navigation.loading")} aria-busy="true">
      <div className="h-8 w-56 rounded-xl bg-surface-strong" />
      <div className="h-4 w-full max-w-xl rounded-lg bg-surface-strong" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-border bg-surface" />
    </div>
  );
}
