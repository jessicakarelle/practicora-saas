"use client";

import { translate as t } from "@/i18n";

import { use, useEffect, useMemo, useState } from "react";
import { GraduationCap, Search, UserCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { listOrganizationMembers, type OrganizationMember } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function StudentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationMember[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { let cancelled = false; void (async () => { if (!organizationId) return; setLoading(true); const rows = await listOrganizationMembers(organizationId); if (!cancelled) { setItems(rows.filter((row) => row.roles.includes("student"))); setLoading(false); } })(); return () => { cancelled = true; }; }, [organizationId]);
  const filtered = useMemo(() => items.filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.students.students")} description={t(locale, "organization.students.view_students_allowed_by_your_role_then_open_their_assigned_placements_reports_a")} />
    <Card className="mb-5"><CardContent><div className="relative max-w-xl"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "organization.students.search_student")} /></div></CardContent></Card>
    {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><div className="h-44 animate-pulse rounded-2xl bg-surface-muted" /></div> : filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((student) => <Card key={student.membershipId}><CardContent><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary-softer text-primary"><UserRound className="size-5" /></span><StatusBadge status={student.status} locale={locale} /></div><h2 className="mt-4 text-lg font-extrabold">{student.fullName || (t(locale, "organization.students.student"))}</h2><p className="mt-1 text-sm text-muted">{student.email}</p><div className="mt-5 flex items-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm font-bold text-muted-strong"><UserCheck className="size-4 text-success" />{t(locale, "organization.students.institutional_profile_resolved")}</div></CardContent></Card>)}</div> : <EmptyState icon={GraduationCap} title={t(locale, "organization.students.no_accessible_students")} description={t(locale, "organization.students.students_will_appear_after_accepting_their_invitation_or_being_assigned_to_your_")} />}
  </OrganizationRequired>;
}
