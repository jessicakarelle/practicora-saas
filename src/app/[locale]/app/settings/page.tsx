"use client";

import { translate as t } from "@/i18n";

import { use, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  ChevronDown,
  Cloud,
  Database,
  Globe2,
  KeyRound,
  LockKeyhole,
  Palette,
  Plus,
  RotateCcw,
  Route,
  ShieldCheck,
  TimerReset,
  UserRound,
  Rows3,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  Input,
  PasswordInput,
} from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PROTECTED_SECTIONS,
  hashPin,
  markSecurityUnlocked,
  normalizeCustomProtectedPath,
  requestSecurityLock,
} from "@/lib/security";
import { usePracticora } from "@/lib/store";
import {
  countryOptions,
  currencyOptions,
  dateFormatOptions,
  regionOptions,
  themePresetOptions,
  timezoneOptions,
} from "@/lib/preferences";
import type {
  CountryCode,
  CurrencyCode,
  DateFormat,
  ProtectedSectionId,
  ThemeMode,
  ThemePreset,
  Locale,
} from "@/lib/types";

const sectionGroups: {
  key: "overview" | "journal" | "progress" | "management";
  sections: ProtectedSectionId[];
}[] = [
  { key: "overview", sections: ["dashboard", "week", "calendar"] },
  { key: "journal", sections: ["journal", "history", "notes"] },
  {
    key: "progress",
    sections: ["objectives", "skills", "evaluation", "analytics"],
  },
  {
    key: "management",
    sections: [
      "internships",
      "compensation",
      "reports",
      "account",
      "settings",
      "trash",
    ],
  },
];

export default function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const dialog = useDialog();
  const { data, cloudEnabled, syncStatus, updateSettings, resetAllData } =
    usePracticora();
  const settings = data.settings;
  const security = settings.security;
  const [showPinForm, setShowPinForm] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [openProtectionGroup, setOpenProtectionGroup] = useState<
    (typeof sectionGroups)[number]["key"] | null
  >("overview");
  const [customPathError, setCustomPathError] = useState("");

  function changeTheme(theme: ThemeMode) {
    updateSettings({ theme });
    setTheme(theme);
  }

  async function savePin() {
    setPinError("");
    if (security.enabled && security.pinHash) {
      const currentHash = await hashPin(currentPin);
      if (currentHash !== security.pinHash) {
        setPinError(t(locale, "app.settings.the_current_pin_is_incorrect"));
        return;
      }
    }
    if (!/^\d{4,8}$/.test(newPin)) {
      setPinError(
        t(locale, "app.settings.the_new_code_must_contain_4_to_8_digits"),
      );
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(t(locale, "app.settings.the_two_new_codes_do_not_match"));
      return;
    }
    if (security.enabled && currentPin === newPin) {
      setPinError(
        t(locale, "app.settings.the_new_code_must_differ_from_the_old_one"),
      );
      return;
    }

    setSavingPin(true);
    try {
      const pinHash = await hashPin(newPin);
      updateSettings({
        security: {
          ...security,
          enabled: true,
          pinHash,
          pinLength: newPin.length,
          protectedSections: security.protectedSections.length
            ? security.protectedSections
            : [...DEFAULT_PROTECTED_SECTIONS],
        },
      });
      markSecurityUnlocked();
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setShowPinForm(false);
      toast.success(t(locale, "app.settings.pin_protection_is_active"));
    } finally {
      setSavingPin(false);
    }
  }

  function toggleProtectedSection(
    section: ProtectedSectionId,
    checked: boolean,
  ) {
    const protectedSections = checked
      ? [...new Set([...security.protectedSections, section])]
      : security.protectedSections.filter((item) => item !== section);
    updateSettings({ security: { ...security, protectedSections } });
  }

  function addCustomProtectedPath() {
    setCustomPathError("");
    const normalized = normalizeCustomProtectedPath(customPath);
    if (!normalized) {
      setCustomPathError(
        t(
          locale,
          "app.settings.use_an_internal_path_starting_with_app_for_example_app_private_documents",
        ),
      );
      return;
    }
    if (security.customProtectedPaths.includes(normalized)) {
      setCustomPathError(t(locale, "app.settings.this_page_is_already_added"));
      return;
    }
    updateSettings({
      security: {
        ...security,
        customProtectedPaths: [...security.customProtectedPaths, normalized],
      },
    });
    setCustomPath("");
    toast.success(t(locale, "app.settings.custom_page_added_to_protection"));
  }

  function removeCustomProtectedPath(path: string) {
    updateSettings({
      security: {
        ...security,
        customProtectedPaths: security.customProtectedPaths.filter(
          (item) => item !== path,
        ),
      },
    });
  }

  async function disableSecurity() {
    const confirmed = await dialog.confirm({
      title: t(locale, "app.settings.disable_protection"),
      description: t(
        locale,
        "app.settings.currently_protected_pages_will_become_accessible_without_a_pin_on_this_device",
      ),
      confirmLabel: t(locale, "app.settings.disable"),
      cancelLabel: t(locale, "app.settings.keep_protection"),
      tone: "danger",
    });
    if (!confirmed) return;
    updateSettings({
      security: {
        ...security,
        enabled: false,
        pinHash: "",
        pinLength: 4,
      },
    });
    markSecurityUnlocked();
    setShowPinForm(false);
    toast.success(t(locale, "app.settings.pin_protection_was_disabled"));
  }

  async function resetWorkspace() {
    const confirmed = await dialog.confirm({
      title: t(locale, "app.settings.reset_the_entire_workspace"),
      description: t(
        locale,
        "app.settings.this_removes_internships_entries_goals_notes_settings_and_trash_items_stored_in_",
      ),
      confirmLabel: t(locale, "app.settings.reset_permanently"),
      cancelLabel: t(locale, "app.settings.cancel"),
      tone: "danger",
    });
    if (!confirmed) return;
    resetAllData();
    toast.success(t(locale, "app.settings.practicora_was_reset"));
  }

  const sectionLabels: Record<
    ProtectedSectionId,
    { title: string; description: string }
  > = {
    dashboard: {
      title: t(locale, "app.settings.dashboard"),
      description: t(
        locale,
        "app.settings.global_summary_progress_and_recent_activity",
      ),
    },
    week: {
      title: t(locale, "app.settings.this_week"),
      description: t(locale, "app.settings.weekly_planning_and_tracking"),
    },
    calendar: {
      title: t(locale, "app.settings.calendar"),
      description: t(locale, "app.settings.internship_days_hours_and_events"),
    },
    journal: {
      title: t(locale, "app.settings.new_entry"),
      description: t(locale, "app.settings.complete_journal_entry_form"),
    },
    history: {
      title: t(locale, "app.settings.history"),
      description: t(locale, "app.settings.search_and_review_logged_days"),
    },
    notes: {
      title: t(locale, "app.settings.notes"),
      description: t(
        locale,
        "app.settings.meetings_ideas_references_and_follow_ups",
      ),
    },
    objectives: {
      title: t(locale, "app.settings.goals"),
      description: t(locale, "app.settings.goals_deadlines_and_progress"),
    },
    skills: {
      title: t(locale, "app.settings.skills"),
      description: t(locale, "app.settings.observed_skills_and_technologies"),
    },
    evaluation: {
      title: t(locale, "app.settings.evaluation"),
      description: t(
        locale,
        "app.settings.review_strengths_and_improvement_areas",
      ),
    },
    analytics: {
      title: t(locale, "app.settings.analytics"),
      description: t(
        locale,
        "app.settings.statistics_trends_and_progression_data",
      ),
    },
    internships: {
      title: t(locale, "app.settings.internships"),
      description: t(locale, "app.settings.companies_supervisors_and_periods"),
    },
    compensation: {
      title: t(locale, "app.settings.compensation"),
      description: t(
        locale,
        "app.settings.rates_salary_estimates_and_deductions",
      ),
    },
    account: {
      title: t(locale, "app.settings.account"),
      description: t(
        locale,
        "app.settings.profile_email_security_and_communication_preferences",
      ),
    },
    reports: {
      title: t(locale, "app.settings.reports_and_exports"),
      description: t(locale, "app.settings.detailed_reports_pdf_and_backups"),
    },
    settings: {
      title: t(locale, "app.settings.settings"),
      description: t(locale, "app.settings.profile_backup_sync_and_security"),
    },
    trash: {
      title: t(locale, "app.settings.trash"),
      description: t(locale, "app.settings.deleted_items_and_restoration"),
    },
  };

  const groupLabels = {
    overview: t(locale, "app.settings.overview"),
    journal: t(locale, "app.settings.journal"),
    progress: t(locale, "app.settings.progress"),
    management: t(locale, "app.settings.management"),
  };

  return (
    <>
      <PageHeader
        title={t(locale, "app.settings.settings")}
        description={t(
          locale,
          "app.settings.customize_your_profile_display_language_backup_and_privacy",
        )}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <UserRound className="size-5 text-primary" />
                {t(locale, "app.settings.profile_managed_separately")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(
                  locale,
                  "app.settings.profile_managed_separately_description",
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-softer text-primary">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-foreground">
                  {settings.name || t(locale, "app.settings.complete_profile")}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {t(locale, "app.settings.profile_identity_notice")}
                </p>
              </div>
              <ButtonLink
                href={`/${locale}/app/account`}
                variant="secondary"
                size="sm"
              >
                <UserRound className="size-4" />
                {t(locale, "app.settings.open_profile")}
              </ButtonLink>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Palette className="size-5 text-primary" />
                {t(locale, "app.settings.appearance_and_density")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(locale, "app.settings.appearance_and_density_description")}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(locale, "app.settings.theme")}>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => changeTheme(value as ThemeMode)}
                  options={[
                    {
                      value: "system",
                      label: t(locale, "app.settings.system"),
                    },
                    { value: "light", label: t(locale, "app.settings.light") },
                    { value: "dark", label: t(locale, "app.settings.dark") },
                  ]}
                />
              </Field>
              <Field label={t(locale, "app.settings.theme_style")}>
                <Select
                  value={settings.themePreset}
                  onValueChange={(value) =>
                    updateSettings({ themePreset: value as ThemePreset })
                  }
                  options={themePresetOptions(locale)}
                />
              </Field>
            </div>
            <PreferenceRow
              title={t(locale, "app.settings.compact_mode")}
              description={t(
                locale,
                "app.settings.slightly_reduces_workspace_spacing",
              )}
              checked={settings.compactMode}
              onCheckedChange={(checked) =>
                updateSettings({ compactMode: checked })
              }
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Globe2 className="size-5 text-primary" />
                {t(locale, "app.settings.regional_preferences")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(locale, "app.settings.regional_preferences_description")}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label={t(locale, "app.settings.preferred_language")}>
                <Select
                  value={settings.locale}
                  onValueChange={(value) => {
                    const nextLocale = value as Locale;
                    updateSettings({ locale: nextLocale });
                    const segments = pathname.split("/");
                    segments[1] = nextLocale;
                    router.push(segments.join("/") || `/${nextLocale}/app/settings`);
                  }}
                  options={[
                    { value: "fr", label: t(locale, "common.language-switcher.native_fr") },
                    { value: "en", label: t(locale, "common.language-switcher.native_en") },
                    { value: "es", label: t(locale, "common.language-switcher.native_es") },
                    { value: "pt", label: t(locale, "common.language-switcher.native_pt") },
                    { value: "de", label: t(locale, "common.language-switcher.native_de") },
                    { value: "it", label: t(locale, "common.language-switcher.native_it") },
                    { value: "ar", label: t(locale, "common.language-switcher.native_ar") },
                  ]}
                />
              </Field>
              <Field label={t(locale, "app.settings.currency")}>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    updateSettings({ currency: value as CurrencyCode })
                  }
                  options={currencyOptions(locale)}
                />
              </Field>
              <Field label={t(locale, "app.settings.country")}>
                <Select
                  value={settings.country}
                  onValueChange={(value) => {
                    const country = value as CountryCode;
                    updateSettings({
                      country,
                      region:
                        regionOptions(locale, country)[0]?.value || country,
                    });
                  }}
                  options={countryOptions(locale)}
                />
              </Field>
              <Field label={t(locale, "app.settings.region")}>
                <Select
                  value={settings.region}
                  onValueChange={(region) => updateSettings({ region })}
                  options={regionOptions(locale, settings.country)}
                />
              </Field>
              <Field label={t(locale, "app.settings.time_zone")}>
                <Select
                  value={settings.timezone}
                  onValueChange={(timezone) => updateSettings({ timezone })}
                  options={timezoneOptions(locale)}
                  startIcon={<Globe2 className="size-4" />}
                />
              </Field>
              <Field label={t(locale, "app.settings.date_format")}>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) =>
                    updateSettings({ dateFormat: value as DateFormat })
                  }
                  options={dateFormatOptions(locale)}
                  startIcon={<CalendarRange className="size-4" />}
                />
              </Field>
              <Field label={t(locale, "app.settings.week_starts_on")}>
                <Select
                  value={String(settings.weekStartsOn)}
                  onValueChange={(value) =>
                    updateSettings({ weekStartsOn: value === "0" ? 0 : 1 })
                  }
                  options={[
                    { value: "1", label: t(locale, "app.settings.monday") },
                    { value: "0", label: t(locale, "app.settings.sunday") },
                  ]}
                />
              </Field>
              <Field label={t(locale, "app.settings.default_page_size")}>
                <Select
                  value={String(settings.defaultPageSize)}
                  onValueChange={(value) =>
                    updateSettings({
                      defaultPageSize: Number(value) as 10 | 25 | 50 | 100,
                    })
                  }
                  options={[10, 25, 50, 100].map((value) => ({
                    value: String(value),
                    label: t(locale, "app.settings.items_per_page", {
                      count: value,
                    }),
                  }))}
                  startIcon={<Rows3 className="size-4" />}
                />
              </Field>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <PreferenceRow
                title={t(locale, "app.settings.holiday_calendar")}
                description={t(
                  locale,
                  "app.settings.holiday_calendar_description",
                )}
                checked={settings.holidayCalendar}
                onCheckedChange={(holidayCalendar) =>
                  updateSettings({ holidayCalendar })
                }
              />
              <PreferenceRow
                title={t(locale, "app.settings.reminders")}
                description={t(
                  locale,
                  "app.settings.prepares_journal_and_report_reminders",
                )}
                checked={settings.remindersEnabled}
                onCheckedChange={(remindersEnabled) =>
                  updateSettings({ remindersEnabled })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="size-5 text-primary" />
                {t(locale, "app.settings.privacy_and_protected_pages")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(
                  locale,
                  "app.settings.mask_sensitive_pages_behind_a_pin_and_add_your_own_custom_paths",
                )}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${security.enabled ? "bg-success/10 text-success" : "bg-surface-muted text-muted-strong"}`}
            >
              {security.enabled
                ? t(locale, "app.settings.protection_active")
                : t(locale, "app.settings.not_configured")}
            </span>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                    <KeyRound className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-foreground">
                      {security.enabled
                        ? t(locale, "app.settings.pin_configured")
                        : t(locale, "app.settings.no_pin_configured")}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {t(
                        locale,
                        "app.settings.the_code_contains_4_to_8_digits_and_is_never_stored_as_plain_text",
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPinError("");
                    setShowPinForm((value) => !value);
                  }}
                >
                  <KeyRound className="size-4" />
                  {security.enabled
                    ? t(locale, "app.settings.change_pin")
                    : t(locale, "app.settings.set_up_pin")}
                </Button>
                <Button
                  variant="danger"
                  disabled={!security.enabled}
                  onClick={() => {
                    requestSecurityLock();
                    toast.info(t(locale, "app.settings.practicora_is_locked"));
                  }}
                >
                  <LockKeyhole className="size-4" />
                  {t(locale, "app.settings.lock_now")}
                </Button>
              </div>
            </div>

            {showPinForm ? (
              <div className="rounded-2xl border border-primary/20 bg-primary-softer/55 p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  {security.enabled ? (
                    <Field label={t(locale, "app.settings.current_pin")}>
                      <PasswordInput
                        inputMode="numeric"
                        autoComplete="current-password"
                        maxLength={8}
                        value={currentPin}
                        onChange={(event) =>
                          setCurrentPin(event.target.value.replace(/\D/g, ""))
                        }
                        showLabel={t(locale, "app.settings.show_pin")}
                        hideLabel={t(locale, "app.settings.hide_pin")}
                      />
                    </Field>
                  ) : null}
                  <Field label={t(locale, "app.settings.new_pin")}>
                    <PasswordInput
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={8}
                      value={newPin}
                      onChange={(event) =>
                        setNewPin(event.target.value.replace(/\D/g, ""))
                      }
                      showLabel={t(locale, "app.settings.show_pin")}
                      hideLabel={t(locale, "app.settings.hide_pin")}
                    />
                  </Field>
                  <Field label={t(locale, "app.settings.confirm")}>
                    <PasswordInput
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={8}
                      value={confirmPin}
                      onChange={(event) =>
                        setConfirmPin(event.target.value.replace(/\D/g, ""))
                      }
                      showLabel={t(locale, "app.settings.show_pin")}
                      hideLabel={t(locale, "app.settings.hide_pin")}
                    />
                  </Field>
                </div>
                <FieldHint>
                  {t(
                    locale,
                    "app.settings.the_pin_is_converted_to_a_sha_256_fingerprint_before_storage",
                  )}
                </FieldHint>
                <FieldError>{pinError}</FieldError>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={savePin} disabled={savingPin}>
                    {savingPin
                      ? t(locale, "app.settings.saving")
                      : t(locale, "app.settings.save_pin")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowPinForm(false);
                      setPinError("");
                    }}
                  >
                    {t(locale, "app.settings.cancel")}
                  </Button>
                  {security.enabled ? (
                    <Button
                      variant="ghost"
                      onClick={() => void disableSecurity()}
                    >
                      {t(locale, "app.settings.disable_protection_2")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[.62fr_1.38fr]">
              <div>
                <Field label={t(locale, "app.settings.automatic_lock")}>
                  <Select
                    value={String(security.autoLockMinutes)}
                    disabled={!security.enabled}
                    startIcon={<TimerReset className="size-4.5" />}
                    onValueChange={(value) =>
                      updateSettings({
                        security: {
                          ...security,
                          autoLockMinutes: Number(value) as
                            5 | 15 | 30 | 60 | 9999,
                        },
                      })
                    }
                    options={[
                      {
                        value: "5",
                        label: t(locale, "app.settings.after_5_minutes"),
                      },
                      {
                        value: "15",
                        label: t(locale, "app.settings.after_15_minutes"),
                      },
                      {
                        value: "30",
                        label: t(locale, "app.settings.after_30_minutes"),
                      },
                      {
                        value: "60",
                        label: t(locale, "app.settings.after_1_hour"),
                      },
                      {
                        value: "9999",
                        label: t(locale, "app.settings.never_automatically"),
                      },
                    ]}
                  />
                </Field>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {t(
                    locale,
                    "app.settings.after_inactivity_the_entire_workspace_is_masked_until_the_next_unlock",
                  )}
                </p>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold text-foreground">
                  {t(locale, "app.settings.built_in_pages_to_mask")}
                </div>
                <div className="space-y-2">
                  {sectionGroups.map((group) => {
                    const expanded = openProtectionGroup === group.key;
                    const selectedCount = group.sections.filter((section) =>
                      security.protectedSections.includes(section),
                    ).length;
                    return (
                      <div
                        key={group.key}
                        className="overflow-hidden rounded-xl border border-border bg-background"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenProtectionGroup((current) =>
                              current === group.key ? null : group.key,
                            )
                          }
                          aria-expanded={expanded}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-muted/55"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-foreground">
                              {groupLabels[group.key]}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {t(locale, "app.settings.protected_count", {
                                count: selectedCount,
                                total: group.sections.length,
                              })}
                            </span>
                          </span>
                          <ChevronDown
                            className={`size-4 shrink-0 text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        <div
                          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="grid gap-2 border-t border-border p-2.5 md:grid-cols-2">
                              {group.sections.map((section) => {
                                const meta = sectionLabels[section];
                                return (
                                  <div
                                    key={section}
                                    className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-foreground">
                                        {meta.title}
                                      </div>
                                      <p className="mt-0.5 line-clamp-1 text-xs leading-5 text-muted">
                                        {meta.description}
                                      </p>
                                    </div>
                                    <Switch
                                      checked={security.protectedSections.includes(
                                        section,
                                      )}
                                      disabled={!security.enabled}
                                      onCheckedChange={(checked) =>
                                        toggleProtectedSection(section, checked)
                                      }
                                      ariaLabel={`${t(locale, "app.settings.protect")} ${meta.title}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                  <Route className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    {t(locale, "app.settings.custom_pages")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {t(
                      locale,
                      "app.settings.add_an_internal_route_created_later_in_practicora_its_subpages_will_also_be_prot",
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Input
                  value={customPath}
                  disabled={!security.enabled}
                  onChange={(event) => {
                    setCustomPath(event.target.value);
                    setCustomPathError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomProtectedPath();
                    }
                  }}
                  placeholder={t(
                    locale,
                    "app.settings.custom_path_placeholder",
                  )}
                />
                <Button
                  className="shrink-0"
                  disabled={!security.enabled || !customPath.trim()}
                  onClick={addCustomProtectedPath}
                >
                  <Plus className="size-4" />
                  {t(locale, "app.settings.add")}
                </Button>
              </div>
              <FieldError>{customPathError}</FieldError>
              {security.customProtectedPaths.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {security.customProtectedPaths.map((path) => (
                    <span
                      key={path}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-muted-strong"
                    >
                      <span className="font-mono">{path}</span>
                      <button
                        type="button"
                        onClick={() => removeCustomProtectedPath(path)}
                        className="inline-flex size-5 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label={`${t(locale, "app.settings.remove")} ${path}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Cloud className="size-5 text-primary" />
                {t(locale, "app.settings.backup_and_sync")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(
                  locale,
                  "app.settings.browser_storage_remains_primary_supabase_adds_sync_when_configured",
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold">
                    {cloudEnabled
                      ? t(locale, "app.settings.supabase_sync_available")
                      : t(locale, "app.settings.secure_local_mode")}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {cloudEnabled
                      ? t(
                          locale,
                          "app.settings.sign_in_to_sync_your_data_automatically",
                        )
                      : t(
                          locale,
                          "app.settings.data_is_saved_in_this_browser_and_remains_exportable_as_json",
                        )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${syncStatus === "error" ? "bg-danger/10 text-danger" : syncStatus === "synced" ? "bg-success/10 text-success" : "bg-primary-softer text-primary"}`}
                >
                  {syncStatus}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Database className="size-5 text-danger" />
                {t(locale, "app.settings.data_zone")}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t(
                  locale,
                  "app.settings.use_this_action_only_after_exporting_a_backup",
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="danger" onClick={() => void resetWorkspace()}>
              <RotateCcw className="size-4" />
              {t(locale, "app.settings.reset_all_data")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-sm text-muted">{description}</span>
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        ariaLabel={title}
      />
    </div>
  );
}
