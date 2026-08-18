"use client";

import { translate as t } from "@/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus, ShieldCheck, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { destinationForWorkspace, platformRoleLabel, roleLabel } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const router = useRouter();
  const { context, activeWorkspace, switchWorkspace, loading, hasPermission } = useWorkspace();
  const [open, setOpen] = useState(false);

  async function select(id: string) {
    const workspace = context.workspaces.find((item) => item.id === id);
    if (!workspace) return;
    await switchWorkspace(id);
    setOpen(false);
    router.push(destinationForWorkspace(locale, workspace));
  }

  if (loading || !activeWorkspace) {
    return <div className={cn("h-10 animate-pulse rounded-xl bg-[var(--sidebar-active)]", compact ? "w-10" : "w-full")} />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-panel)] px-3 text-left text-[var(--sidebar-text)] transition-[background-color,border-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--sidebar-indicator)_34%,var(--sidebar-border))] hover:bg-[var(--sidebar-hover)] hover:shadow-sm",
          compact && "size-10 min-h-10 justify-center px-0",
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--sidebar-active)]">
          {activeWorkspace.kind === "personal" ? <UserRound className="size-4" /> : activeWorkspace.kind === "platform" ? <ShieldCheck className="size-4" /> : <Building2 className="size-4" />}
        </span>
        {!compact ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-extrabold">{activeWorkspace.name}</span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold text-[var(--sidebar-muted)]">
                {activeWorkspace.kind === "personal"
                  ? t(locale, "common.navigation.personal_workspace")
                  : activeWorkspace.kind === "platform"
                    ? activeWorkspace.roleKeys.map((role) => platformRoleLabel(role, locale)).join(" · ")
                    : activeWorkspace.roleKeys.map((role) => roleLabel(role, locale)).join(" · ")}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-[var(--sidebar-muted)]" />
          </>
        ) : null}
      </button>
      <AnimatePresence>
        {open ? (
          <>
            <button className="fixed inset-0 z-[69] cursor-default" onClick={() => setOpen(false)} aria-label={t(locale, "common.navigation.close")} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute top-[calc(100%+8px)] left-0 z-[70] w-[270px] overflow-hidden rounded-2xl border border-border bg-surface p-2 text-foreground shadow-2xl"
              role="listbox"
            >
              <div className="px-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">{t(locale, "common.navigation.available_workspaces")}</div>
              <div className="max-h-72 space-y-1 overflow-y-auto overscroll-contain">
                {context.workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    type="button"
                    role="option"
                    aria-selected={workspace.id === activeWorkspace.id}
                    onClick={() => void select(workspace.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-muted"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-softer text-primary">
                      {workspace.kind === "personal" ? <UserRound className="size-4" /> : workspace.kind === "platform" ? <ShieldCheck className="size-4" /> : <Building2 className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{workspace.name}</span>
                      <span className="block truncate text-[11px] text-muted">
                        {workspace.kind === "personal"
                          ? t(locale, "common.navigation.private")
                          : workspace.kind === "platform"
                            ? workspace.roleKeys.map((role) => platformRoleLabel(role, locale)).join(" · ")
                            : workspace.roleKeys.map((role) => roleLabel(role, locale)).join(" · ")}
                      </span>
                    </span>
                    {workspace.id === activeWorkspace.id ? <Check className="size-4 text-primary" /> : null}
                  </button>
                ))}
              </div>
              {activeWorkspace.kind === "platform" && hasPermission("platform.organizations.create") ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/${locale}/app/organization/new`);
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-sm font-bold text-primary transition-colors hover:bg-primary-softer"
                >
                  <Plus className="size-4" />
                  {t(locale, "common.navigation.create_institutional_workspace")}
                </button>
              ) : null}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
