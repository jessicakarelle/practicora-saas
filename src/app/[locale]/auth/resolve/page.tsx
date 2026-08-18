"use client";

import { translate as t } from "@/i18n";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle, Network, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/marketing/brand";
import { Card, CardContent } from "@/components/ui/card";
import { destinationForWorkspace, resolveWorkspaceContext, setLastWorkspace } from "@/lib/organization";

export default function ResolveAccountPage() {
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const locale = params.locale || "fr";
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      try {
        const context = await resolveWorkspaceContext(locale);
        if (cancelled) return;
        const recommended = context.workspaces.find((workspace) => workspace.id === context.recommendedWorkspaceId) || context.workspaces[0];
        const managed = context.workspaces.filter((workspace) => workspace.kind !== "personal");
        if (managed.length > 1 && (!recommended || recommended.kind === "personal")) {
          router.replace(`/${locale}/app/workspaces`);
          return;
        }
        const workspace = recommended || context.workspaces.find((item) => item.kind === "personal");
        if (!workspace) {
          router.replace(`/${locale}/app`);
          return;
        }
        await setLastWorkspace(workspace);
        router.replace(destinationForWorkspace(locale, workspace));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center"><Brand locale={locale} /></div>
        <Card><CardContent className="p-7 text-center sm:p-9">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-softer text-primary">
            {error ? <ShieldCheck className="size-5" /> : <Network className="size-5" />}
          </span>
          <h1 className="mt-5 text-xl font-extrabold">{t(locale, "auth.resolve.preparing_your_workspace")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{error || (t(locale, "auth.resolve.we_are_checking_your_organizations_roles_permissions_and_assignments_before_open"))}</p>
          {!error ? <LoaderCircle className="mx-auto mt-5 size-5 animate-spin text-primary" /> : <Link className="mt-6 inline-flex font-bold text-primary" href={`/${locale}/app`}>{t(locale, "auth.resolve.continue_to_personal_workspace")}</Link>}
        </CardContent></Card>
      </div>
    </main>
  );
}
