"use client";

import { translate as t } from "@/i18n";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, Send } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { FieldLabel, Input } from "@/components/ui/field";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const dialog = useDialog();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      await dialog.validation({
        title: t(locale, "auth.forgot-password-form.invalid_email_address"),
        description: t(locale, "auth.forgot-password-form.enter_the_address_used_to_create_the_account"),
        details: [t(locale, "auth.forgot-password-form.the_email_format_must_be_valid")],
      });
      return;
    }

    if (!isSupabaseConfigured()) {
      await dialog.alert({
        title: t(locale, "auth.forgot-password-form.local_mode_is_active"),
        description: t(locale, "auth.forgot-password-form.password_recovery_requires_supabase_your_local_data_remains_available_in_this_br"),
        tone: "warning",
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const redirectTo = `${window.location.origin}/${locale}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) {
      await dialog.alert({
        title: t(locale, "auth.forgot-password-form.unable_to_send"),
        description: error.message,
        tone: "danger",
      });
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center"><Brand locale={locale} /></div>
        <Card>
          <CardContent className="p-7 sm:p-9">
            <div className="text-center">
              <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-primary-softer text-primary"><KeyRound className="size-5.5" /></span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.04em]">{t(locale, "auth.forgot-password-form.reset_your_password")}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-strong">{t(locale, "auth.forgot-password-form.we_will_send_a_secure_link_so_you_can_choose_a_new_password")}</p>
            </div>

            {sent ? (
              <div className="mt-7 rounded-2xl border border-success/20 bg-success/8 p-5 text-center">
                <Send className="mx-auto size-5 text-success" />
                <h2 className="mt-3 font-extrabold">{t(locale, "auth.forgot-password-form.email_sent")}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-strong">{t(locale, "auth.forgot-password-form.check_your_inbox_and_spam_folder_the_link_will_return_you_to_practicora")}</p>
                <ButtonLink href={`/${locale}/login`} className="mt-5">{t(locale, "auth.forgot-password-form.back_to_sign_in")}</ButtonLink>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
                <div>
                  <FieldLabel>{t(locale, "auth.forgot-password-form.email_address")}</FieldLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                    <Input className="pl-10" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t(locale, "auth.forgot-password-form.email_placeholder")} />
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? (t(locale, "auth.forgot-password-form.sending")) : (t(locale, "auth.forgot-password-form.send_secure_link"))}</Button>
              </form>
            )}
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-muted"><Link href={`/${locale}/login`} className="font-semibold hover:text-foreground">{t(locale, "auth.forgot-password-form.back_to_sign_in")}</Link></p>
      </div>
    </main>
  );
}
