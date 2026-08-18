"use client";

import { translate as t } from "@/i18n";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, LoaderCircle, MailCheck, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthState } from "@/lib/auth";
import { acceptInvitation } from "@/lib/organization";

export default function InvitationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = use(params);
  const auth = useAuthState();
  const router = useRouter();
  const [state, setState] = useState<"ready" | "accepting" | "accepted" | "error">("ready");
  const [message, setMessage] = useState("");

  async function accept() {
    if (!auth.user) return;
    setState("accepting");
    const result = await acceptInvitation(decodeURIComponent(token));
    if (result.error) {
      setState("error");
      setMessage(result.error.message);
      return;
    }
    setState("accepted");
    setMessage(t(locale, "marketing.invite.your_membership_and_role_were_added_practicora_will_now_open_the_correct_dashboa"));
    window.setTimeout(() => router.replace(`/${locale}/auth/resolve`), 900);
  }

  const next = `/${locale}/invite/${encodeURIComponent(token)}`;
  return <main className="min-h-screen bg-background px-4 py-10 sm:py-16"><div className="mx-auto max-w-lg"><div className="mb-8 flex justify-center"><Brand locale={locale} /></div><Card><CardContent className="p-7 text-center sm:p-10">
    <span className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${state === "accepted" ? "bg-success/10 text-success" : state === "error" ? "bg-danger/10 text-danger" : "bg-primary-softer text-primary"}`}>{state === "accepting" ? <LoaderCircle className="size-6 animate-spin" /> : state === "accepted" ? <CheckCircle2 className="size-6" /> : <Building2 className="size-6" />}</span>
    <h1 className="mt-6 text-2xl font-extrabold tracking-[-.04em]">{t(locale, "marketing.invite.institutional_invitation")}</h1>
    <p className="mt-3 text-sm leading-7 text-muted-strong">{message || (!auth.configured ? (t(locale, "marketing.invite.supabase_must_be_configured_to_accept_an_institutional_invitation")) : (t(locale, "marketing.invite.this_invitation_already_contains_the_organization_role_and_intended_assignments_")))}</p>
    {!auth.loading && !auth.user ? <div className="mt-7 space-y-3"><ButtonLink className="w-full justify-center" href={`/${locale}/login?next=${encodeURIComponent(next)}`}><ShieldCheck className="size-4" />{t(locale, "marketing.invite.sign_in_to_continue")}</ButtonLink><ButtonLink variant="secondary" className="w-full justify-center" href={`/${locale}/register?next=${encodeURIComponent(next)}`}><MailCheck className="size-4" />{t(locale, "marketing.invite.create_account")}</ButtonLink></div> : null}
    {auth.user && state === "ready" ? <div className="mt-7"><div className="mb-4 rounded-xl border border-border bg-background p-3 text-left text-sm"><div className="text-xs font-bold uppercase tracking-[.08em] text-muted">{t(locale, "marketing.invite.signed_in_account")}</div><div className="mt-1 font-bold">{auth.user.email}</div></div><Button className="w-full justify-center" size="lg" onClick={() => void accept()}>{t(locale, "marketing.invite.accept_invitation")}</Button></div> : null}
    {state === "accepted" ? <LoaderCircle className="mx-auto mt-6 size-5 animate-spin text-success" /> : null}
    {state === "error" ? <Link className="mt-6 inline-flex font-bold text-primary" href={`/${locale}/app/workspaces`}>{t(locale, "marketing.invite.back_to_workspaces")}</Link> : null}
  </CardContent></Card></div></main>;
}
