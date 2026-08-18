"use client";

import { translate as t } from "@/i18n";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const params = useParams<{ locale: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const locale = params.locale || "fr";
  const fr = locale !== "en";
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function complete() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError(t(locale, "auth.callback.supabase_is_not_configured"));
        return;
      }
      const code = search.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && !cancelled) {
          setError(exchangeError.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session && !cancelled) {
        setError(t(locale, "auth.callback.the_sign_in_could_not_be_confirmed"));
        return;
      }
      const requested = search.get("next");
      const safeNext = requested?.startsWith(`/${locale}/`) ? requested : `/${locale}/auth/resolve`;
      if (!cancelled) router.replace(safeNext);
    }
    void complete();
    return () => {
      cancelled = true;
    };
  }, [fr, locale, router, search]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Brand locale={locale} /></div>
        <Card><CardContent className="p-7 text-center sm:p-9">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-softer text-primary">
            {error ? <ShieldCheck className="size-5" /> : <LoaderCircle className="size-5 animate-spin" />}
          </span>
          <h1 className="mt-5 text-xl font-extrabold">{error ? (t(locale, "auth.callback.sign_in_interrupted")) : (t(locale, "auth.callback.secure_sign_in"))}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{error || (t(locale, "auth.callback.practicora_is_completing_sign_in_and_automatically_resolving_your_workspace_and_"))}</p>
          {error ? <Link className="mt-6 inline-flex font-bold text-primary" href={`/${locale}/login`}>{t(locale, "auth.callback.back_to_sign_in")}</Link> : null}
        </CardContent></Card>
      </div>
    </main>
  );
}
