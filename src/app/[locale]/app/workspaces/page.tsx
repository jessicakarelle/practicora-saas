"use client";

import { translate as t } from "@/i18n";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Plus, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { destinationForWorkspace, platformRoleLabel, roleLabel } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

function workspaceRoleName(workspace: import("@/lib/organization").PracticoraWorkspace, role: string, locale: string) {
  return workspace.kind === "platform"
    ? platformRoleLabel(role as import("@/lib/platform").PlatformRoleKey, locale)
    : roleLabel(role as import("@/lib/organization").OrganizationRoleKey, locale);
}

export default function WorkspacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { context, activeWorkspace, switchWorkspace, loading } = useWorkspace();

  async function activate(id: string) {
    const workspace = context.workspaces.find((item) => item.id === id);
    if (!workspace) return;
    await switchWorkspace(id);
    router.push(destinationForWorkspace(locale, workspace));
  }

  return (
    <>
      <PageHeader title={t(locale, "app.workspaces.workspaces")} description={t(locale, "app.workspaces.practicora_automatically_resolves_your_memberships_and_roles_switch_workspaces_w")} actions={<ButtonLink href={`/${locale}/app/organization/new`}><Plus className="size-4" />{t(locale, "app.workspaces.create_organization")}</ButtonLink>} />
      {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-surface-muted" /><div className="h-56 animate-pulse rounded-2xl bg-surface-muted" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {context.workspaces.map((workspace) => {
            const active = workspace.id === activeWorkspace?.id;
            return <Card key={workspace.id} className={active ? "border-primary/40 ring-2 ring-primary/8" : undefined}><CardContent className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-softer text-primary">{workspace.kind === "personal" ? <UserRound className="size-5" /> : workspace.kind === "platform" ? <ShieldCheck className="size-5" /> : <Building2 className="size-5" />}</span>
                {active ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success"><CheckCircle2 className="size-3.5" />{t(locale, "app.workspaces.active")}</span> : null}
              </div>
              <h2 className="mt-5 text-lg font-extrabold">{workspace.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{workspace.kind === "personal" ? t(locale, "app.workspaces.your_private_internships_journals_goals_compensation_and_personal_reports") : workspace.kind === "platform" ? t(locale, "common.organization.platform_workspace_description") : t(locale, "app.workspaces.institutional_workspace_with_verified_role_and_permission_based_access")}</p>
              <div className="mt-4 flex flex-wrap gap-2">{workspace.roleKeys.map((role) => <span key={role} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold text-muted-strong">{workspaceRoleName(workspace, role, locale)}</span>)}</div>
              <div className="mt-auto pt-6"><Button variant={active ? "secondary" : "primary"} className="w-full justify-center" onClick={() => void activate(workspace.id)}>{active ? <ShieldCheck className="size-4" /> : null}{active ? (t(locale, "app.workspaces.open_workspace")) : (t(locale, "app.workspaces.activate_workspace"))}</Button></div>
            </CardContent></Card>;
          })}
        </div>
      )}
    </>
  );
}
