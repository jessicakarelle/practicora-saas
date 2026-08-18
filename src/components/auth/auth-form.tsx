"use client";

import { translate as t } from "@/i18n";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, KeyRound, LockKeyhole, Mail, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldLabel, Input, PasswordInput, PasswordStrength } from "@/components/ui/field";
import { confirmationRedirect } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, findDemoAccount, isDemoModeAvailable, writeDemoRole } from "@/lib/demo";

export function AuthForm({ locale, mode }: { locale: string; mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : `/${locale}/auth/resolve`;
  const dialog = useDialog();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const configured = isSupabaseConfigured();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const issues: string[] = [];
    if (mode === "register" && name.trim().length < 2) issues.push(t(locale, "auth.auth-form.add_your_full_name"));
    if (!/^\S+@\S+\.\S+$/.test(email)) issues.push(t(locale, "auth.auth-form.enter_a_valid_email_address"));
    if (password.length < 8) issues.push(t(locale, "auth.auth-form.password_must_contain_at_least_8_characters"));
    if (mode === "register" && !acceptedLegal) issues.push(t(locale, "auth.auth-form.accept_legal_required"));
    const demoAccount = mode === "login" ? findDemoAccount(email, password) : null;
    if (demoAccount) {
      writeDemoRole(demoAccount.role);
      localStorage.setItem(BRAND.localProfileKey, JSON.stringify({ name: demoAccount.fullName, email: demoAccount.email, demoRole: demoAccount.role }));
      toast.success(t(locale, "auth.auth-form.demo_session_started"));
      router.push(`/${locale}/auth/resolve`);
      return;
    }

    if (issues.length) {
      await dialog.validation({
        title: t(locale, "auth.auth-form.check_the_form"),
        description: t(locale, "auth.auth-form.a_few_details_must_be_corrected_before_continuing"),
        details: issues,
        confirmLabel: t(locale, "auth.auth-form.review"),
      });
      return;
    }

    if (!configured) {
      localStorage.setItem(BRAND.localProfileKey, JSON.stringify({ name, email, legalAcceptedAt: mode === "register" ? new Date().toISOString() : undefined, legalVersion: mode === "register" ? "2026-07" : undefined }));
      toast.success(t(locale, "auth.auth-form.local_mode_activated"));
      router.push(nextPath);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const result = mode === "register"
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, legal_accepted_at: new Date().toISOString(), legal_version: "2026-07" },
            emailRedirectTo: confirmationRedirect(locale, nextPath),
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (result.error) {
      const unconfirmed = /confirm|verified|verification/i.test(result.error.message);
      if (unconfirmed) {
        await dialog.alert({
          title: t(locale, "auth.auth-form.email_not_verified"),
          description: t(locale, "auth.auth-form.open_the_confirmation_link_sent_by_email_then_sign_in_again"),
          tone: "warning",
          confirmLabel: t(locale, "auth.auth-form.got_it"),
        });
        router.push(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      await dialog.alert({
        title: t(locale, "auth.auth-form.unable_to_continue"),
        description: result.error.message,
        tone: "danger",
        confirmLabel: t(locale, "auth.auth-form.close"),
      });
      return;
    }

    if (mode === "register" && !result.data.session) {
      router.push(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
      return;
    }

    toast.success(mode === "register" ? (t(locale, "auth.auth-form.account_created")) : (t(locale, "auth.auth-form.signed_in")));
    router.push(nextPath);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex justify-center"><Brand locale={locale} /></div>
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><LockKeyhole className="size-5" /></span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{mode === "login" ? (t(locale, "auth.auth-form.sign_in")) : (t(locale, "auth.auth-form.create_account"))}</h1>
              <p className="mt-2 text-sm leading-6 text-muted">{configured ? t(locale, "auth.auth-form.synced_workspace_description", { brand: BRAND.name }) : t(locale, "auth.auth-form.local_workspace_description", { brand: BRAND.name })}</p>
            </div>
            <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
              {mode === "register" ? <Field label={t(locale, "auth.auth-form.full_name")} icon={UserRound}><Input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field> : null}
              <Field label={t(locale, "auth.auth-form.email")} icon={Mail}><Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></Field>
              <Field label={t(locale, "auth.auth-form.password")} icon={LockKeyhole}><PasswordInput required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} showLabel={t(locale, "auth.auth-form.show_password")} hideLabel={t(locale, "auth.auth-form.hide_password")} />{mode === "register" ? <PasswordStrength password={password} locale={locale} /> : null}</Field>
              {mode === "login" ? <div className="flex justify-end"><Link href={`/${locale}/forgot-password`} className="text-xs font-bold text-primary hover:text-primary-strong">{t(locale, "auth.auth-form.forgot_password")}</Link></div> : null}
              {mode === "register" ? <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3.5 py-3 text-xs leading-5 text-muted-strong"><input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={acceptedLegal} onChange={(event)=>setAcceptedLegal(event.target.checked)}/><span>{t(locale,"auth.auth-form.legal_prefix")} <Link className="font-bold text-primary hover:text-primary-strong" href={`/${locale}/terms`}>{t(locale,"auth.auth-form.terms_link")}</Link> {t(locale,"auth.auth-form.legal_and")} <Link className="font-bold text-primary hover:text-primary-strong" href={`/${locale}/privacy`}>{t(locale,"auth.auth-form.privacy_link")}</Link>.</span></label> : null}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? (t(locale, "auth.auth-form.loading")) : mode === "login" ? (t(locale, "auth.auth-form.sign_in_2")) : (t(locale, "auth.auth-form.create_my_account"))}<ArrowRight className="size-4" /></Button>
            </form>
            <div className="mt-4 border-t border-border pt-4"><SocialAuthButtons locale={locale} mode={mode} nextPath={nextPath} /></div>
            {mode === "login" && isDemoModeAvailable() ? (
              <details className="group mt-4 rounded-xl border border-border bg-surface-muted/35">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-sm font-bold text-muted-strong transition-colors hover:text-primary">
                  <UsersRound className="size-4 text-primary" />
                  <span className="min-w-0 flex-1">{t(locale, "auth.auth-form.demo_accounts_title")}</span>
                  <span className="text-xs font-semibold text-muted group-open:hidden">{t(locale, "auth.auth-form.demo_accounts_hint")}</span>
                </summary>
                <div className="border-t border-border p-2.5">
                  <p className="px-1 pb-2 text-xs leading-5 text-muted">{t(locale, "auth.auth-form.demo_accounts_description")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DEMO_ACCOUNTS.map((account) => (
                      <button
                        key={account.role}
                        type="button"
                        onClick={() => { setEmail(account.email); setPassword(DEMO_PASSWORD); }}
                        className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-softer"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-softer text-primary"><KeyRound className="size-4" /></span>
                        <span className="min-w-0"><span className="block truncate text-xs font-extrabold text-foreground">{t(locale, `auth.auth-form.demo_role_${account.role}`)}</span><span className="block truncate text-[10px] text-muted">{account.email}</span></span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 rounded-lg bg-background px-3 py-2 text-[11px] text-muted"><span className="font-bold text-foreground">{t(locale, "auth.auth-form.demo_password")}</span> {DEMO_PASSWORD}</p>
                </div>
              </details>
            ) : null}
            <p className="mt-4 text-center text-sm text-muted">{mode === "login" ? (t(locale, "auth.auth-form.no_account_yet")) : (t(locale, "auth.auth-form.already_have_an_account"))} <Link className="font-bold text-primary hover:text-primary-strong" href={`/${locale}/${mode === "login" ? "register" : "login"}`}>{mode === "login" ? (t(locale, "auth.auth-form.create_account")) : (t(locale, "auth.auth-form.sign_in_2"))}</Link></p>
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted"><Link href={`/${locale}`} className="font-semibold hover:text-foreground">{t(locale, "auth.auth-form.back_to_website")}</Link></p>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel><div className="relative"><Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><div className="[&_input]:pl-10">{children}</div></div></div>;
}
