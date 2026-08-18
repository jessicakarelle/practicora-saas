"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Cloud,
  Download,
  GraduationCap,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuthState } from "@/lib/auth";
import { usePracticora } from "@/lib/store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function getTimezoneOptions(locale: string) {
  return [
    { value: "America/Toronto", label: t(locale, "common.misc.timezone_toronto_montreal") },
    { value: "America/Vancouver", label: t(locale, "common.misc.timezone_vancouver") },
    { value: "America/Edmonton", label: t(locale, "common.misc.timezone_edmonton_calgary") },
    { value: "America/Halifax", label: t(locale, "common.misc.timezone_halifax") },
    { value: "Europe/Paris", label: t(locale, "common.misc.timezone_paris") },
    { value: "Africa/Douala", label: t(locale, "common.misc.timezone_douala") },
  ];
}

export default function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const dialog = useDialog();
  const auth = useAuthState();
  const { data, activeInternship, syncStatus, updateSettings } = usePracticora();
  const settings = data.settings;
  const [pendingEmailOverride, setPendingEmailOverride] = useState<string | null>(null);
  const pendingEmail = pendingEmailOverride ?? settings.email ?? auth.user?.email ?? "";
  const [profileStatus, setProfileStatus] = useState<"saved" | "syncing" | "error">("saved");
  const firstCloudSync = useRef(true);

  useEffect(() => {
    if (firstCloudSync.current) {
      firstCloudSync.current = false;
      return;
    }
    if (!auth.configured || !auth.user) return;
    const timer = window.setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      setProfileStatus("syncing");
      const { error } = await supabase.auth.updateUser({
        data: {
          name: settings.name,
          program: settings.program,
          school: settings.school,
          phone: settings.phone,
          graduation_year: settings.graduationYear,
          career_goal: settings.careerGoal,
          portfolio_url: settings.portfolioUrl,
          linkedin_url: settings.linkedinUrl,
        },
      });
      setProfileStatus(error ? "error" : "saved");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    auth.configured,
    auth.user,
    settings.careerGoal,
    settings.graduationYear,
    settings.linkedinUrl,
    settings.name,
    settings.phone,
    settings.portfolioUrl,
    settings.program,
    settings.school,
  ]);

  const initials = useMemo(() => {
    const value = settings.name || auth.user?.email || "P";
    return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
  }, [auth.user?.email, settings.name]);

  const accountCreatedAt = auth.user?.created_at
    ? new Intl.DateTimeFormat(t(locale, "app.account.en_ca"), { dateStyle: "medium" }).format(new Date(auth.user.created_at))
    : null;
  const lastSignIn = auth.user?.last_sign_in_at
    ? new Intl.DateTimeFormat(t(locale, "app.account.en_ca"), { dateStyle: "medium", timeStyle: "short" }).format(new Date(auth.user.last_sign_in_at))
    : null;

  async function updateEmail() {
    const nextEmail = pendingEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(nextEmail)) {
      await dialog.validation({
        title: t(locale, "app.account.invalid_email_address"),
        details: [t(locale, "app.account.enter_a_complete_email_address")],
        confirmLabel: t(locale, "app.account.review"),
      });
      return;
    }

    updateSettings({ email: nextEmail });
    if (!auth.configured || !auth.user || nextEmail === auth.user.email) {
      toast.success(t(locale, "app.account.email_saved_locally"));
      return;
    }

    const confirmed = await dialog.confirm({
      title: t(locale, "app.account.change_email_address"),
      description: t(locale, "app.account.supabase_will_send_a_confirmation_link_the_old_address_remains_active_until_the_"),
      confirmLabel: t(locale, "app.account.send_verification"),
      cancelLabel: t(locale, "app.account.cancel"),
    });
    if (!confirmed) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) {
      await dialog.alert({ title: t(locale, "app.account.unable_to_change_email"), description: error.message, tone: "danger" });
      return;
    }
    toast.success(t(locale, "app.account.verification_email_sent"));
  }

  async function resendVerification() {
    const email = auth.user?.email || pendingEmail;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      await dialog.alert({ title: t(locale, "app.account.unable_to_send"), description: error.message, tone: "danger" });
      return;
    }
    toast.success(t(locale, "app.account.a_new_confirmation_email_was_sent"));
  }

  async function sendPasswordReset() {
    const email = auth.user?.email || pendingEmail;
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !email) return;
    const redirectTo = `${window.location.origin}/${locale}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      await dialog.alert({ title: t(locale, "app.account.unable_to_send"), description: error.message, tone: "danger" });
      return;
    }
    toast.success(t(locale, "app.account.password_reset_link_sent"));
  }

  function exportWorkspace() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `practicora-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(t(locale, "app.account.backup_downloaded"));
  }

  async function signOut() {
    const confirmed = await dialog.confirm({
      title: t(locale, "app.account.sign_out"),
      description: t(locale, "app.account.the_local_copy_of_your_data_will_remain_available_in_this_browser"),
      confirmLabel: t(locale, "app.account.sign_out_2"),
      cancelLabel: t(locale, "app.account.stay_signed_in"),
    });
    if (!confirmed) return;
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title={t(locale, "app.account.account_and_profile")}
        description={t(locale, "app.account.manage_your_identity_security_communications_and_data_portability")}
      />

      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent className="text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-[26px] bg-primary-softer text-2xl font-extrabold text-primary">{initials}</div>
              <h2 className="mt-4 text-xl font-extrabold">{settings.name || (t(locale, "app.account.complete_your_profile"))}</h2>
              <p className="mt-1 text-sm text-muted">{auth.user?.email || settings.email || (t(locale, "app.account.local_mode"))}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <StatusPill icon={auth.verified ? CheckCircle2 : MailCheck} tone={auth.verified ? "success" : "warning"} label={auth.verified ? (t(locale, "app.account.email_verified")) : (t(locale, "app.account.email_not_verified"))} />
                <StatusPill icon={auth.configured && auth.user ? Cloud : ShieldCheck} tone="primary" label={auth.configured && auth.user ? (t(locale, "app.account.cloud_beta")) : (t(locale, "app.account.local_mode"))} />
              </div>
              <div className="mt-5 rounded-xl border border-border bg-background p-3 text-left text-sm">
                <div className="flex items-center gap-2 font-bold"><BriefcaseBusiness className="size-4 text-primary" />{activeInternship.name}</div>
                <p className="mt-1 text-xs leading-5 text-muted">{activeInternship.company || (t(locale, "app.account.company_not_provided"))}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="text-base font-extrabold">{t(locale, "app.account.account_status")}</h2></div></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label={t(locale, "app.account.storage")} value={syncStatus === "synced" ? (t(locale, "app.account.synced")) : syncStatus === "error" ? (t(locale, "app.account.error")) : (t(locale, "app.account.automatic"))} />
              {accountCreatedAt ? <InfoRow label={t(locale, "app.account.account_created")} value={accountCreatedAt} /> : null}
              {lastSignIn ? <InfoRow label={t(locale, "app.account.last_sign_in")} value={lastSignIn} /> : null}
              <InfoRow label={t(locale, "app.account.data_version")} value={`V${data.version}`} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound className="size-5 text-primary" />{t(locale, "app.account.professional_profile")}</h2>
                <p className="mt-1 text-sm text-muted">{t(locale, "app.account.every_change_is_saved_automatically_profile_details_also_sync_with_your_cloud_ac")}</p>
              </div>
              <span className={`inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${profileStatus === "error" ? "bg-danger/10 text-danger" : profileStatus === "syncing" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                {profileStatus === "error" ? (t(locale, "app.account.cloud_error")) : profileStatus === "syncing" ? (t(locale, "app.account.syncing")) : (t(locale, "app.account.up_to_date"))}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ProfileField label={t(locale, "app.account.full_name")} icon={UserRound}><Input value={settings.name} onChange={(event) => updateSettings({ name: event.target.value })} autoComplete="name" /></ProfileField>
                <ProfileField label={t(locale, "app.account.study_program")} icon={GraduationCap}><Input value={settings.program} onChange={(event) => updateSettings({ program: event.target.value })} /></ProfileField>
                <ProfileField label={t(locale, "app.account.institution")} icon={GraduationCap}><Input value={settings.school} onChange={(event) => updateSettings({ school: event.target.value })} /></ProfileField>
                <ProfileField label={t(locale, "app.account.graduation_year")} icon={GraduationCap}><Input inputMode="numeric" value={settings.graduationYear} onChange={(event) => updateSettings({ graduationYear: event.target.value.replace(/\D/g, "").slice(0, 4) })} /></ProfileField>
                <ProfileField label={t(locale, "app.account.phone")} icon={UserRound}><Input type="tel" value={settings.phone} onChange={(event) => updateSettings({ phone: event.target.value })} autoComplete="tel" /></ProfileField>
                <div><FieldLabel>{t(locale, "app.account.time_zone")}</FieldLabel><Select value={settings.timezone} onValueChange={(timezone) => updateSettings({ timezone })} options={getTimezoneOptions(locale)} startIcon={<MapPin className="size-4" />} /></div>
                <ProfileField label={t(locale, "app.account.portfolio")} icon={Link2}><Input type="url" value={settings.portfolioUrl} onChange={(event) => updateSettings({ portfolioUrl: event.target.value })} placeholder={t(locale, "app.account.website_placeholder")} /></ProfileField>
                <ProfileField label={t(locale, "app.account.linkedin")} icon={Link2}><Input type="url" value={settings.linkedinUrl} onChange={(event) => updateSettings({ linkedinUrl: event.target.value })} placeholder={t(locale, "app.account.linkedin_placeholder")} /></ProfileField>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div><FieldLabel>{t(locale, "app.account.career_goal")}</FieldLabel><Textarea className="min-h-24" value={settings.careerGoal} onChange={(event) => updateSettings({ careerGoal: event.target.value })} /></div>
                <div><FieldLabel>{t(locale, "app.account.short_bio")}</FieldLabel><Textarea className="min-h-24" value={settings.bio} onChange={(event) => updateSettings({ bio: event.target.value })} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="flex items-center gap-2 text-lg font-bold"><Mail className="size-5 text-primary" />{t(locale, "app.account.email_and_security")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.account.actions_that_change_account_access_require_explicit_confirmation")}</p></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <div><FieldLabel htmlFor="account-email">{t(locale, "app.account.email_address")}</FieldLabel><Input id="account-email" type="email" value={pendingEmail} onChange={(event) => setPendingEmailOverride(event.target.value)} /><FieldHint>{auth.verified ? (t(locale, "app.account.currently_verified_address")) : (t(locale, "app.account.check_your_inbox_to_enable_all_cloud_features"))}</FieldHint></div>
                <Button variant="secondary" className="h-11 md:mb-[26px]" onClick={() => void updateEmail()}><MailCheck className="size-4" />{t(locale, "app.account.update")}</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {!auth.verified && auth.configured ? <Button variant="secondary" onClick={() => void resendVerification()}><MailCheck className="size-4" />{t(locale, "app.account.resend_verification")}</Button> : null}
                {auth.configured ? <Button variant="secondary" onClick={() => void sendPasswordReset()}><KeyRound className="size-4" />{t(locale, "app.account.reset_password")}</Button> : null}
                <ButtonLink href={`/${locale}/app/settings#security`} variant="secondary"><ShieldCheck className="size-4" />{t(locale, "app.account.pin_protection")}</ButtonLink>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="flex items-center gap-2 text-lg font-bold"><Bell className="size-5 text-primary" />{t(locale, "app.account.communications")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "app.account.these_preferences_autosave_and_prepare_future_cloud_notifications")}</p></div></CardHeader>
            <CardContent className="space-y-3">
              <PreferenceRow title={t(locale, "app.account.product_updates")} description={t(locale, "app.account.receive_important_practicora_updates")} checked={settings.emailUpdates} onCheckedChange={(emailUpdates) => updateSettings({ emailUpdates })} />
              <PreferenceRow title={t(locale, "app.account.weekly_digest")} description={t(locale, "app.account.receive_a_summary_of_hours_goals_and_incomplete_entries")} checked={settings.weeklyDigest} onCheckedChange={(weeklyDigest) => updateSettings({ weeklyDigest })} />
              <PreferenceRow title={t(locale, "app.account.security_alerts")} description={t(locale, "app.account.be_informed_about_sensitive_account_changes")} checked={settings.securityAlerts} onCheckedChange={(securityAlerts) => updateSettings({ securityAlerts })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" />{t(locale, "app.account.data_and_session")}</h2></div></CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="secondary" onClick={exportWorkspace}><Download className="size-4" />{t(locale, "app.account.download_my_data")}</Button>
              <ButtonLink href={`/${locale}/app/reports`} variant="secondary"><Cloud className="size-4" />{t(locale, "app.account.reports_and_backups")}</ButtonLink>
              {auth.configured && auth.user ? <Button variant="danger" onClick={() => void signOut()}><LogOut className="size-4" />{t(locale, "app.account.sign_out_2")}</Button> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ProfileField({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel><div className="relative"><Icon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted" /><div className="[&_input]:pl-10">{children}</div></div></div>;
}

function StatusPill({ icon: Icon, label, tone }: { icon: typeof CheckCircle2; label: string; tone: "success" | "warning" | "primary" }) {
  const style = tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-primary-softer text-primary";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${style}`}><Icon className="size-3.5" />{label}</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border-soft pb-3 last:border-0 last:pb-0"><span className="text-muted">{label}</span><span className="text-right font-bold text-foreground">{value}</span></div>;
}

function PreferenceRow({ title, description, checked, onCheckedChange }: { title: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"><span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-sm leading-5 text-muted">{description}</span></span><Switch checked={checked} onCheckedChange={onCheckedChange} ariaLabel={title} /></div>;
}
