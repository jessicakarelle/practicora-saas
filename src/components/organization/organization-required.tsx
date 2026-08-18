"use client";

import { translate as t } from "@/i18n";

import { Building2, LoaderCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useWorkspace } from "@/lib/workspace";

export function OrganizationRequired({ locale, children }: { locale: string; children: React.ReactNode }) {
  const { loading, activeWorkspace } = useWorkspace();
  if (loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-primary" /></div>;
  if (activeWorkspace?.kind !== "organization") {
    return <EmptyState icon={Building2} title={t(locale, "common.misc.no_institutional_workspace_selected")} description={t(locale, "common.misc.choose_an_existing_organization_or_create_an_institutional_workspace_to_use_thes")} action={<ButtonLink href={`/${locale}/app/workspaces`}>{t(locale, "common.misc.choose_workspace")}</ButtonLink>} />;
  }
  return <>{children}</>;
}
