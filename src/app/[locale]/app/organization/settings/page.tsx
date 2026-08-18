"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useRef, useState } from "react";
import { Archive, Building2, CheckCircle2, Database, Globe2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getOrganizationSettings, updateOrganizationSettings, type OrganizationSettings } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function OrganizationSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace, refresh } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "saved" | "saving" | "error">("loading");
  const initialized = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { let cancelled = false; void (async () => { if (!organizationId) return; const value = await getOrganizationSettings(organizationId); if (!cancelled) { setSettings(value); setStatus("saved"); initialized.current = true; } })(); return () => { cancelled = true; }; }, [organizationId]);

  useEffect(() => {
    if (!initialized.current || !settings || !organizationId) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      const result = await updateOrganizationSettings(organizationId, settings);
      if (result.error) { setStatus("error"); toast.error(result.error.message); } else { setStatus("saved"); await refresh(); }
    }, 850);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [organizationId, refresh, settings]);

  function patch(input: Partial<OrganizationSettings>) { setSettings((current) => current ? { ...current, ...input } : current); }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.settings.organization_settings")} description={t(locale, "organization.settings.ordinary_settings_save_automatically_permissions_remain_enforced_by_the_database")} actions={<div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status === "error" ? "bg-danger/10 text-danger" : status === "saving" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{status === "saving" ? <span className="size-2 animate-pulse rounded-full bg-warning" /> : <CheckCircle2 className="size-3.5" />}{status === "saving" ? (t(locale, "organization.settings.saving")) : status === "error" ? (t(locale, "organization.settings.error")) : (t(locale, "organization.settings.saved"))}</div>} />
    {!settings ? <div className="h-72 animate-pulse rounded-2xl bg-surface-muted" /> : <div className="grid gap-5 xl:grid-cols-2">
      <Card><CardHeader><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><Building2 className="size-5 text-primary" />{t(locale, "organization.settings.identity")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.settings.information_shown_to_members_and_in_reports")}</p></div></CardHeader><CardContent className="space-y-4">
        <div><FieldLabel>{t(locale, "organization.settings.name")}</FieldLabel><Input value={settings.name} onChange={(e) => patch({ name: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "organization.settings.type")}</FieldLabel><Select value={settings.type} onValueChange={(type) => patch({ type })} options={[{ value: "college", label: t(locale, "organization.settings.college") }, { value: "university", label: t(locale, "organization.settings.university") }, { value: "school", label: t(locale, "organization.settings.school") }, { value: "company", label: t(locale, "organization.settings.company") }, { value: "association", label: t(locale, "organization.settings.association") }]} /></div><div><FieldLabel>{t(locale, "organization.settings.country")}</FieldLabel><Select value={settings.country} onValueChange={(country) => patch({ country })} options={[{ value: "CA", label: t(locale, "common.misc.country_canada") }, { value: "US", label: t(locale, "organization.settings.united_states") }, { value: "FR", label: t(locale, "common.misc.country_france") }, { value: "BE", label: t(locale, "organization.settings.belgium") }, { value: "CH", label: t(locale, "organization.settings.switzerland") }, { value: "OTHER", label: t(locale, "organization.settings.other") }]} /></div></div>
        <div><FieldLabel>{t(locale, "organization.settings.website")}</FieldLabel><Input type="url" value={settings.website} onChange={(e) => patch({ website: e.target.value })} placeholder={t(locale, "organization.settings.website_placeholder")} /></div><div><FieldLabel>{t(locale, "organization.settings.administrative_email")}</FieldLabel><Input type="email" value={settings.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} /></div>
      </CardContent></Card>
      <Card><CardHeader><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><Globe2 className="size-5 text-primary" />{t(locale, "organization.settings.region_and_time")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.settings.used_for_deadlines_notifications_and_exports")}</p></div></CardHeader><CardContent className="space-y-4"><div><FieldLabel>{t(locale, "organization.settings.timezone")}</FieldLabel><Select value={settings.timezone} onValueChange={(timezone) => patch({ timezone })} options={[{ value: "America/Toronto", label: t(locale, "common.misc.timezone_america_toronto") }, { value: "America/Montreal", label: t(locale, "common.misc.timezone_america_montreal") }, { value: "America/Vancouver", label: t(locale, "common.misc.timezone_america_vancouver") }, { value: "America/New_York", label: t(locale, "common.misc.timezone_america_new_york") }, { value: "Europe/Paris", label: t(locale, "common.misc.timezone_europe_paris") }, { value: "UTC", label: "UTC" }]} /></div><div><FieldLabel>{t(locale, "organization.settings.public_identifier")}</FieldLabel><Input value={settings.slug} disabled /><FieldHint>{t(locale, "organization.settings.the_identifier_is_locked_to_avoid_breaking_existing_invitations_and_links")}</FieldHint></div></CardContent></Card>
      <Card><CardHeader><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><ShieldCheck className="size-5 text-primary" />{t(locale, "organization.settings.compliance_controls")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.settings.rules_applied_to_accounts_and_approvals")}</p></div></CardHeader><CardContent className="space-y-3"><SettingSwitch title={t(locale, "organization.settings.require_verified_email")} description={t(locale, "organization.settings.blocks_institutional_use_until_email_confirmation")} checked={settings.requireEmailVerification} onChange={(requireEmailVerification) => patch({ requireEmailVerification })} /><SettingSwitch title={t(locale, "organization.settings.require_supervisor_approval")} description={t(locale, "organization.settings.applicable_hours_or_reports_require_supervisor_approval")} checked={settings.requireSupervisorApproval} onChange={(requireSupervisorApproval) => patch({ requireSupervisorApproval })} /><SettingSwitch title={t(locale, "organization.settings.allow_student_exports")} description={t(locale, "organization.settings.allows_students_to_download_their_own_data_and_reports")} checked={settings.allowStudentExports} onChange={(allowStudentExports) => patch({ allowStudentExports })} /></CardContent></Card>
      <Card><CardHeader><div><h2 className="flex items-center gap-2 text-lg font-extrabold"><Database className="size-5 text-primary" />{t(locale, "organization.settings.data_retention")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "organization.settings.prepares_administrative_archiving_without_automatically_deleting_active_records")}</p></div></CardHeader><CardContent className="space-y-4"><div><FieldLabel>{t(locale, "organization.settings.retention_period")}</FieldLabel><Select value={String(settings.retentionMonths)} onValueChange={(value) => patch({ retentionMonths: Number(value) })} options={[{ value: "12", label: t(locale, "organization.settings.text_1_year") }, { value: "36", label: t(locale, "organization.settings.text_3_years") }, { value: "60", label: t(locale, "organization.settings.text_5_years") }, { value: "84", label: t(locale, "organization.settings.text_7_years") }]} /></div><SettingSwitch title={t(locale, "organization.settings.archive_completed_placements")} description={t(locale, "organization.settings.automatically_moves_completed_placements_to_the_archive_after_the_grace_period")} checked={settings.autoArchiveCompleted} onChange={(autoArchiveCompleted) => patch({ autoArchiveCompleted })} icon={Archive} /></CardContent></Card>
    </div>}
  </OrganizationRequired>;
}

function SettingSwitch({ title, description, checked, onChange, icon: Icon }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void; icon?: typeof Archive }) { return <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">{Icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-4" /></span> : null}<div className="min-w-0 flex-1"><div className="text-sm font-extrabold">{title}</div><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>; }
