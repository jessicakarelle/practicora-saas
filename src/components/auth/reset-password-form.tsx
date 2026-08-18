"use client";

import { translate as t } from "@/i18n";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, LoaderCircle, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldLabel, PasswordInput, PasswordStrength } from "@/components/ui/field";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function ResetPasswordForm({ locale }: { locale: string }) {
  const dialog = useDialog();
  const configured = isSupabaseConfigured();
  const [sessionReady, setSessionReady] = useState(!configured);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setSessionReady(Boolean(data.session));
    }, 0);
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setSessionReady(true);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, [configured]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const issues: string[] = [];
    if (password.length < 10) issues.push(t(locale, "auth.reset-password-form.use_at_least_10_characters"));
    if (!/[A-Z]/.test(password)) issues.push(t(locale, "auth.reset-password-form.add_at_least_one_uppercase_letter"));
    if (!/[a-z]/.test(password)) issues.push(t(locale, "auth.reset-password-form.add_at_least_one_lowercase_letter"));
    if (!/\d/.test(password)) issues.push(t(locale, "auth.reset-password-form.add_at_least_one_number"));
    if (password !== confirmation) issues.push(t(locale, "auth.reset-password-form.passwords_do_not_match"));
    if (issues.length) {
      await dialog.validation({
        title: t(locale, "auth.reset-password-form.strengthen_the_password"),
        description: t(locale, "auth.reset-password-form.correct_the_following_items_before_continuing"),
        details: issues,
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      await dialog.alert({
        title: t(locale, "auth.reset-password-form.supabase_required"),
        description: t(locale, "auth.reset-password-form.password_reset_requires_an_active_supabase_configuration"),
        tone: "warning",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      await dialog.alert({ title: t(locale, "auth.reset-password-form.unable_to_update"), description: error.message, tone: "danger" });
      return;
    }
    setComplete(true);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center"><Brand locale={locale} /></div>
        <Card>
          <CardContent className="p-7 sm:p-9">
            {complete ? (
              <div className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"><CheckCircle2 className="size-6" /></span>
                <h1 className="mt-5 text-2xl font-extrabold">{t(locale, "auth.reset-password-form.password_updated")}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-strong">{t(locale, "auth.reset-password-form.your_new_password_is_active_you_can_return_to_your_workspace")}</p>
                <ButtonLink href={`/${locale}/app`} className="mt-6">{t(locale, "auth.reset-password-form.open_my_workspace")}</ButtonLink>
              </div>
            ) : !sessionReady ? (
              <div className="text-center">
                <LoaderCircle className="mx-auto size-7 animate-spin text-primary" />
                <h1 className="mt-5 text-xl font-extrabold">{t(locale, "auth.reset-password-form.validating_secure_link")}</h1>
                <p className="mt-2 text-sm leading-6 text-muted">{t(locale, "auth.reset-password-form.this_step_verifies_that_the_recovery_request_is_authentic")}</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-primary-softer text-primary"><KeyRound className="size-5.5" /></span>
                  <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.04em]">{t(locale, "auth.reset-password-form.choose_a_new_password")}</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-strong">{t(locale, "auth.reset-password-form.use_a_unique_combination_that_you_do_not_use_on_another_service")}</p>
                </div>
                <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                  <PasswordField label={t(locale, "auth.reset-password-form.new_password")} value={password} onChange={setPassword} autoComplete="new-password" showStrength locale={locale} />
                  <PasswordField label={t(locale, "auth.reset-password-form.confirm_password")} value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
                  <p className="text-xs leading-5 text-muted">{t(locale, "auth.reset-password-form.at_least_10_characters_with_uppercase_lowercase_and_a_number")}</p>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? (t(locale, "auth.reset-password-form.updating")) : (t(locale, "auth.reset-password-form.update_password"))}</Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-muted"><Link href={`/${locale}/login`} className="font-semibold hover:text-foreground">{t(locale, "auth.reset-password-form.back_to_sign_in")}</Link></p>
      </div>
    </main>
  );
}

function PasswordField({ label, value, onChange, autoComplete, showStrength = false, locale = "fr" }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string; showStrength?: boolean; locale?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted" />
        <PasswordInput
          className="pl-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          showLabel={t(locale, "auth.reset-password-form.show_password")}
          hideLabel={t(locale, "auth.reset-password-form.hide_password")}
        />
      </div>
      {showStrength ? <PasswordStrength password={value} locale={locale} /> : null}
    </div>
  );
}
