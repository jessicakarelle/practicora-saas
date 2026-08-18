"use client";

import { translate as t } from "@/i18n";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth";
import { resolvePlatformContext } from "@/lib/platform";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { readDemoRole, type DemoRoleKey } from "@/lib/demo";

export function AuthBoundary({ locale, children }: { locale: string; children: React.ReactNode }) {
  const auth = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const [accountStatus, setAccountStatus] = useState<"checking" | "active" | "restricted" | "suspended">("checking");
  const [demoRole, setDemoRole] = useState<DemoRoleKey | null>(null);
  const [demoChecked, setDemoChecked] = useState(false);

  useEffect(() => {
    setDemoRole(readDemoRole());
    setDemoChecked(true);
  }, []);

  useEffect(() => {
    if (!demoChecked || demoRole || !auth.configured || auth.loading) return;
    if (!auth.user) {
      router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!auth.verified) {
      router.replace(`/${locale}/verify-email?email=${encodeURIComponent(auth.user.email || "")}`);
    }
  }, [auth.configured, auth.loading, auth.user, auth.verified, demoChecked, demoRole, locale, pathname, router]);

  useEffect(() => {
    if (!demoChecked || demoRole || !auth.configured || auth.loading || !auth.user || !auth.verified) {
      setAccountStatus("checking");
      return;
    }
    let cancelled = false;
    void resolvePlatformContext().then((context) => {
      if (!cancelled) setAccountStatus(context.accountStatus);
    });
    return () => { cancelled = true; };
  }, [auth.configured, auth.loading, auth.user, auth.verified, demoChecked, demoRole]);

  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace(`/${locale}/login`);
  }

  if (demoChecked && demoRole) return <>{children}</>;
  if (!demoChecked) return <div className="flex min-h-screen items-center justify-center bg-background"><LoaderCircle className="size-5 animate-spin text-primary" /></div>;
  if (!auth.configured) return <>{children}</>;
  if (auth.loading || !auth.user || !auth.verified || accountStatus === "checking") {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-softer text-primary">{auth.loading || accountStatus === "checking" ? <LoaderCircle className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}</span><h1 className="mt-4 text-lg font-extrabold">{t(locale, "auth.auth-boundary.checking_session")}</h1><p className="mt-2 text-sm text-muted">{t(locale, "auth.auth-boundary.practicora_is_securing_access_to_your_workspace")}</p></div></div>;
  }
  if (accountStatus === "suspended") {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="w-full max-w-md rounded-3xl border border-danger/20 bg-surface p-7 text-center shadow-[var(--shadow-float)]"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger"><ShieldAlert className="size-5" /></span><h1 className="mt-4 text-xl font-extrabold">{t(locale, "auth.auth-boundary.account_suspended_title")}</h1><p className="mt-2 text-sm leading-6 text-muted">{t(locale, "auth.auth-boundary.account_suspended_description")}</p><Button className="mt-6 w-full" variant="secondary" onClick={() => void signOut()}><LogOut className="size-4" />{t(locale, "auth.auth-boundary.sign_out")}</Button></div></div>;
  }
  return <>{children}</>;
}
