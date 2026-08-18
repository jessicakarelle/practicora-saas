"use client";

import { localeTag, translate as t } from "@/i18n";

import Link from "next/link";
import { MailCheck, Menu, Plus } from "lucide-react";
import { NotificationCenter } from "@/components/app/notification-center";
import { UserMenu } from "@/components/app/user-menu";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuthState } from "@/lib/auth";
import { useStageLog } from "@/lib/store";
import { useWorkspace } from "@/lib/workspace";

export function Topbar({ locale, onMenu }: { locale: string; onMenu: () => void }) {
  const { activeInternship, syncStatus, lastSavedAt } = useStageLog();
  const { activeWorkspace } = useWorkspace();
  const auth = useAuthState();
  const status = {
    local: t(locale, "common.navigation.saved_in_this_browser"),
    saving: t(locale, "common.navigation.saving"),
    syncing: t(locale, "common.navigation.syncing"),
    synced: t(locale, "common.navigation.synced"),
    error: t(locale, "common.navigation.save_error"),
  }[syncStatus];

  const savedTitle = lastSavedAt
    ? new Intl.DateTimeFormat(localeTag(locale), { hour: "2-digit", minute: "2-digit" }).format(new Date(lastSavedAt))
    : undefined;
  const managedWorkspace = activeWorkspace?.kind === "organization" || activeWorkspace?.kind === "platform";
  const platformWorkspace = activeWorkspace?.kind === "platform";
  const canAddJournalEntry = activeWorkspace?.kind === "personal" || (activeWorkspace?.kind === "organization" && activeWorkspace.roleKeys.includes("student"));

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-18 border-b border-border bg-surface/92 backdrop-blur-xl lg:left-[248px]">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-strong hover:bg-surface-muted lg:hidden" onClick={onMenu} aria-label={t(locale, "common.navigation.open_menu")}><Menu className="size-5" /></button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-foreground">{managedWorkspace ? activeWorkspace.name : activeInternship.name}</div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted" data-tooltip={savedTitle ? `${t(locale, "common.navigation.last_saved_at")} ${savedTitle}` : undefined}>
            <span className={`size-1.5 shrink-0 rounded-full ${syncStatus === "error" ? "bg-danger" : syncStatus === "saving" || syncStatus === "syncing" ? "bg-warning" : "bg-success"}`} />
            <span className="truncate">{platformWorkspace ? t(locale, "common.navigation.platform_workspace_active") : managedWorkspace ? t(locale, "common.navigation.institutional_workspace_active") : status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {auth.configured && auth.user && !auth.verified ? <Link href={`/${locale}/verify-email?email=${encodeURIComponent(auth.user.email || "")}`} className="hidden h-10 items-center gap-2 rounded-xl border border-warning/25 bg-warning/8 px-3 text-xs font-bold text-warning hover:bg-warning/12 2xl:inline-flex"><MailCheck className="size-4" />{t(locale, "common.navigation.verify_email")}</Link> : null}
          <LanguageSwitcher locale={locale} compact />
          <NotificationCenter locale={locale} />
          <UserMenu locale={locale} />
          {canAddJournalEntry ? <ButtonLink href={`/${locale}/app/journal/new`} size="sm"><Plus className="size-4" /><span className="hidden md:inline">{t(locale, "common.navigation.add_day")}</span></ButtonLink> : null}
        </div>
      </div>
    </header>
  );
}
