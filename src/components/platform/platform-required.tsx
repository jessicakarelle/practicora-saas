"use client";

import Link from "next/link";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { translate as t } from "@/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspace } from "@/lib/workspace";

export function PlatformRequired({
  locale,
  permission,
  children,
}: {
  locale: string;
  permission?: string;
  children: React.ReactNode;
}) {
  const { loading, activeWorkspace, hasPlatformPermission } = useWorkspace();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" aria-label={t(locale, "common.navigation.loading")} />
      </div>
    );
  }

  const platform = activeWorkspace?.kind === "platform";
  const allowed = platform && (!permission || hasPlatformPermission(permission));

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card>
          <CardContent className="p-7 text-center sm:p-10">
            <span className="mx-auto flex size-13 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <ShieldAlert className="size-6" />
            </span>
            <h1 className="mt-5 text-xl font-extrabold">{t(locale, "common.organization.platform_access_required")}</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
              {t(locale, "common.organization.platform_access_required_description")}
            </p>
            <Link className="mt-6 inline-flex items-center gap-2 font-bold text-primary" href={`/${locale}/app/workspaces`}>
              <ShieldCheck className="size-4" />
              {t(locale, "common.organization.open_workspaces")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
