"use client";

import { use, useEffect, useState } from "react";
import { DatabaseZap, KeyRound, LockKeyhole, ShieldCheck, ShieldEllipsis, UserRoundCog } from "lucide-react";
import { translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listPlatformTeam, type PlatformTeamMember } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformSecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { context } = useWorkspace();
  const [team, setTeam] = useState<PlatformTeamMember[]>([]);
  useEffect(() => { let cancelled = false; void listPlatformTeam().then((data) => { if (!cancelled) setTeam(data); }); return () => { cancelled = true; }; }, []);
  const owners = team.filter((member) => member.roles.includes("platform_owner")).length;
  const critical = context.platform.permissions.filter((permission) => permission.endsWith(".manage") || permission.endsWith(".publish")).length;

  return <PlatformRequired locale={locale} permission="platform.security.view"><PageHeader title={t(locale, "platform.security.title")} description={t(locale, "platform.security.description")} /><div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"><SecurityCard icon={LockKeyhole} title={t(locale, "platform.security.account_gate")} description={t(locale, "platform.security.account_gate_description")} footer={<StatusPill label={t(locale, "platform.security.rls_enabled")} status="active" />} /><SecurityCard icon={UserRoundCog} title={t(locale, "platform.security.last_owner")} description={t(locale, "platform.security.last_owner_description")} footer={<span className="text-sm font-extrabold text-primary">{owners}</span>} /><SecurityCard icon={ShieldEllipsis} title={t(locale, "platform.security.critical_permissions")} description={t(locale, "platform.security.critical_permissions_description")} footer={<span className="text-sm font-extrabold text-primary">{critical}</span>} /><SecurityCard icon={KeyRound} title={t(locale, "platform.security.service_role")} description={t(locale, "platform.security.service_role_description")} footer={<StatusPill label={t(locale, "platform.security.database_enforcement")} status="active" />} /><SecurityCard icon={ShieldCheck} title={t(locale, "platform.security.support_sessions")} description={t(locale, "platform.security.support_sessions_description")} footer={<span className="text-sm font-extrabold text-primary">{t(locale, "platform.security.roles_count", { count: context.platform.roles.length })}</span>} /><SecurityCard icon={DatabaseZap} title={t(locale, "platform.security.database_enforcement")} description={t(locale, "platform.security.recommendation")} footer={<span className="text-sm font-extrabold text-primary">{t(locale, "platform.security.permissions_count", { count: context.platform.permissions.length })}</span>} /></div></PlatformRequired>;
}

function SecurityCard({ icon: Icon, title, description, footer }: { icon: typeof ShieldCheck; title: string; description: string; footer: React.ReactNode }) { return <Card><CardHeader><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-4.5" /></span></CardHeader><CardContent><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-2 min-h-20 text-sm leading-6 text-muted">{description}</p><div className="mt-4 border-t border-border pt-4">{footer}</div></CardContent></Card>; }
