"use client";

import { translate as t } from "@/i18n";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck, RefreshCcw } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { confirmationRedirect } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Suspense fallback={<main className="min-h-screen bg-background" />}><VerifyEmailContent params={params} /></Suspense>;
}

function VerifyEmailContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const email = useSearchParams().get("email") || "";
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useDialog();

  async function resend() {
    if (!email) {
      await dialog.alert({ title: t(locale, "auth.verify-email.missing_email"), description: t(locale, "auth.verify-email.return_to_registration_and_enter_your_email_address"), tone: "warning" });
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmationRedirect(locale) },
    });
    setLoading(false);
    if (error) {
      await dialog.alert({ title: t(locale, "auth.verify-email.unable_to_send"), description: error.message, tone: "danger" });
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center"><Brand locale={locale} /></div>
        <Card>
          <CardContent className="p-7 text-center sm:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-softer text-primary"><MailCheck className="size-6" /></span>
            <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.04em]">{t(locale, "auth.verify-email.verify_your_email")}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-strong">{t(locale, "auth.verify-email.a_confirmation_link_has_been_sent_open_it_to_activate_your_account_and_secure_da")}</p>
            {email ? <div className="mt-5 rounded-xl border border-border bg-background px-4 py-3 font-semibold text-foreground">{email}</div> : null}
            {sent ? <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-4" />{t(locale, "auth.verify-email.a_new_email_was_sent")}</div> : null}
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={resend} disabled={loading} variant="secondary"><RefreshCcw className="size-4" />{loading ? (t(locale, "auth.verify-email.sending")) : (t(locale, "auth.verify-email.resend_email"))}</Button>
              <ButtonLink href={`/${locale}/login`}>{t(locale, "auth.verify-email.i_confirmed_my_email")}</ButtonLink>
            </div>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-sm text-muted"><Link href={`/${locale}`} className="font-semibold hover:text-foreground">{t(locale, "auth.verify-email.back_to_website")}</Link></p>
      </div>
    </main>
  );
}
