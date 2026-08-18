"use client";

import { translate as t } from "@/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleHelp,
  CircleUserRound,
  FilePenLine,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useDialog } from "@/components/ui/dialog-provider";
import { useAuthState } from "@/lib/auth";
import { THEME_PRESETS } from "@/lib/preferences";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useStageLog } from "@/lib/store";
import type { ThemeMode, ThemePreset } from "@/lib/types";
import { DEMO_ACCOUNTS, readDemoRole, writeDemoRole, type DemoRoleKey } from "@/lib/demo";

export function UserMenu({ locale }: { locale: string }) {
  const router = useRouter();
  const dialog = useDialog();
  const auth = useAuthState();
  const { theme, setTheme } = useTheme();
  const { data, updateSettings } = useStageLog();
  const settings = data.settings;
  const [open, setOpen] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRoleKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDemoRole(readDemoRole());
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, []);

  function changeTheme(nextTheme: ThemeMode) {
    updateSettings({ theme: nextTheme });
    setTheme(nextTheme);
  }

  function changePreset(themePreset: ThemePreset) {
    updateSettings({ themePreset });
  }

  async function signOut() {
    const confirmed = await dialog.confirm({
      title: t(locale, "common.navigation.sign_out"),
      description: t(locale, "common.navigation.sign_out_description"),
      confirmLabel: t(locale, "common.navigation.sign_out"),
      cancelLabel: t(locale, "common.navigation.cancel"),
    });
    if (!confirmed) return;
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    writeDemoRole(null);
    setDemoRole(null);
    setOpen(false);
    router.push(`/${locale}`);
    router.refresh();
  }

  const demoAccount = DEMO_ACCOUNTS.find((account) => account.role === demoRole);
  const displayName: string =
    demoAccount?.fullName ||
    settings.name ||
    String(auth.user?.user_metadata?.full_name || "") ||
    t(locale, "common.navigation.my_profile");
  const email = demoAccount?.email || auth.user?.email || settings.email;
  const initials =
    displayName
      .split(/\s+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "P";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(locale, "common.navigation.open_user_menu")}
        className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-2 text-muted-strong transition-[background-color,border-color,color] duration-150 hover:border-primary/30 hover:bg-primary-softer hover:text-primary"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary-softer text-xs font-extrabold text-primary">
          {initials}
        </span>
        <ChevronDown
          className={`hidden size-4 transition-transform duration-200 sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -3, scale: 0.99 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-float)]"
          >
            <div className="border-b border-border bg-surface-muted/30 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-sm font-extrabold text-primary">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-foreground">
                    {displayName}
                  </div>
                  {email ? (
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {email}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-2">
              <MenuLink
                href={`/${locale}/app/account`}
                icon={CircleUserRound}
                label={t(locale, "common.navigation.my_profile")}
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href={`/${locale}/app/journal/drafts`}
                icon={FilePenLine}
                label={t(locale, "common.navigation.drafts")}
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href={`/${locale}/app/settings`}
                icon={Settings}
                label={t(locale, "common.navigation.settings")}
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href={`/${locale}/contact`}
                icon={CircleHelp}
                label={t(locale, "common.navigation.help_and_support")}
                onClick={() => setOpen(false)}
              />
            </div>

            <div className="border-t border-border px-3 py-3">
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted">
                {t(locale, "common.navigation.appearance")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ThemeButton
                  active={theme === "light"}
                  icon={Sun}
                  label={t(locale, "common.navigation.light_theme")}
                  onClick={() => changeTheme("light")}
                />
                <ThemeButton
                  active={theme === "dark"}
                  icon={Moon}
                  label={t(locale, "common.navigation.dark_theme")}
                  onClick={() => changeTheme("dark")}
                />
                <ThemeButton
                  active={theme === "system"}
                  icon={Monitor}
                  label={t(locale, "common.navigation.system_theme")}
                  onClick={() => changeTheme("system")}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => changePreset(preset.value)}
                    data-tooltip={t(
                      locale,
                      `app.settings.theme_${preset.value}`,
                    )}
                    aria-label={t(locale, `app.settings.theme_${preset.value}`)}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-surface shadow-[0_0_0_1px_var(--border)] transition-[box-shadow] hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
                    style={{ backgroundColor: preset.swatch }}
                  >
                    {settings.themePreset === preset.value ? (
                      <Check className="size-3.5 text-white drop-shadow" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => void signOut()}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-danger transition-colors hover:bg-danger/8"
              >
                <LogOut className="size-4.5" />
                {t(locale, "common.navigation.sign_out")}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof CircleUserRound;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted-strong transition-colors hover:bg-primary-softer hover:text-primary"
    >
      <Icon className="size-4.5" />
      {label}
    </Link>
  );
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Sun;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tooltip={label}
      aria-label={label}
      className={`flex h-9 items-center justify-center rounded-xl border transition-colors ${active ? "border-primary/30 bg-primary-softer text-primary" : "border-border bg-background text-muted hover:text-foreground"}`}
    >
      <Icon className="size-4" />
    </button>
  );
}
