"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { listOrganizationMembers, roleLabel, type OrganizationMember } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function MembersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationMember[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!organizationId) return;
      setLoading(true);
      const rows = await listOrganizationMembers(organizationId);
      if (!cancelled) { setItems(rows); setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [organizationId]);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.fullName} ${item.email}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (role === "all" || item.roles.includes(role as never));
  }), [items, query, role]);

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.members.members_and_roles")} description={t(locale, "organization.members.roles_are_assigned_through_invitations_or_by_an_authorized_administrator_they_ar")} actions={<ButtonLink href={`/${locale}/app/organization/invitations`}>{t(locale, "organization.members.manage_invitations")}</ButtonLink>} />
    <Card className="mb-5"><CardContent className="grid gap-3 sm:grid-cols-[1fr_220px]"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "organization.members.search_name_or_email")} /></div><Select value={role} onValueChange={setRole} options={[{ value: "all", label: t(locale, "organization.members.all_roles") }, { value: "owner", label: t(locale, "organization.members.owner") }, { value: "admin", label: t(locale, "organization.members.administrator") }, { value: "program_manager", label: t(locale, "organization.members.program_manager") }, { value: "teacher", label: t(locale, "organization.members.teacher") }, { value: "supervisor", label: t(locale, "organization.members.supervisor") }, { value: "student", label: t(locale, "organization.members.student") }]} /></CardContent></Card>
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" /> : filtered.length ? <Card><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse"><thead><tr className="border-b border-border bg-surface-muted/50 text-left text-[11px] font-extrabold uppercase tracking-[.1em] text-muted"><th className="px-5 py-3">{t(locale, "organization.members.member")}</th><th className="px-5 py-3">{t(locale, "organization.members.roles")}</th><th className="px-5 py-3">{t(locale, "organization.members.status")}</th><th className="px-5 py-3">{t(locale, "organization.members.joined")}</th></tr></thead><tbody>{filtered.map((member) => <tr key={member.membershipId} className="border-b border-border last:border-0 hover:bg-surface-muted/35"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary-softer text-primary"><UserRoundCog className="size-4" /></span><div><div className="font-bold">{member.fullName || member.email}</div><div className="mt-0.5 text-xs text-muted">{member.email}</div></div></div></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1.5">{member.roles.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-bold"><ShieldCheck className="size-3 text-primary" />{roleLabel(item, locale)}</span>)}</div></td><td className="px-5 py-4"><StatusBadge status={member.status} locale={locale} /></td><td className="px-5 py-4 text-sm text-muted">{member.joinedAt ? new Intl.DateTimeFormat(t(locale, "organization.members.en_ca"), { dateStyle: "medium" }).format(new Date(member.joinedAt)) : "—"}</td></tr>)}</tbody></table></div></Card> : <EmptyState icon={Users} title={t(locale, "organization.members.no_members_found")} description={t(locale, "organization.members.change_the_filters_or_invite_a_new_member")} />}
  </OrganizationRequired>;
}
