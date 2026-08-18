"use client";

import { translate as t } from "@/i18n";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthConfirmedPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthConfirmedContent params={params} />
    </Suspense>
  );
}

function AuthConfirmedContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const requestedNext = search.get("next");
  const nextPath = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : `/${locale}/auth/resolve`;
  const [ready, setReady] = useState(() => !isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    async function verifySession() {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabase!.auth.getSession();
        if (data.session?.user?.email_confirmed_at) {
          if (!cancelled) {
            setReady(true);
            window.setTimeout(() => router.replace(nextPath), 900);
          }
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 300));
      }
      if (!cancelled) setReady(true);
    }
    void verifySession();
    return () => { cancelled = true; };
  }, [locale, nextPath, router]);

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center"><Brand locale={locale} /></div>
        <Card>
          <CardContent className="p-8 text-center sm:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">{ready ? <CheckCircle2 className="size-6" /> : <LoaderCircle className="size-6 animate-spin" />}</span>
            <h1 className="mt-6 text-2xl font-extrabold">{ready ? (t(locale, "auth.confirmed.email_confirmed")) : (t(locale, "auth.confirmed.confirming"))}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-strong">{ready ? (t(locale, "auth.confirmed.your_account_is_ready_you_can_now_access_your_secure_workspace")) : (t(locale, "auth.confirmed.we_are_finishing_session_verification"))}</p>
            {ready ? <ButtonLink href={nextPath} className="mt-7">{t(locale, "auth.confirmed.open_my_workspace")}</ButtonLink> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
