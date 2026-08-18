"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, MessageSquareText, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { listInstitutionalReports, updateInstitutionalReportStatus, type InstitutionalReport } from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function InstitutionalReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<InstitutionalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<InstitutionalReport | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setItems(await listInstitutionalReports(organizationId, locale));
    setLoading(false);
  }, [locale, organizationId]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.studentName} ${item.title} ${item.periodLabel}`.toLowerCase();
    const pendingStatuses = ["submitted", "in_review", "changes_requested"];
    return text.includes(query.toLowerCase()) && (status === "all" || status === "pending" ? (status === "all" || pendingStatuses.includes(item.status)) : item.status === status);
  }), [items, query, status]);

  async function review(nextStatus: string) {
    if (!selected) return;
    setSaving(true);
    const result = await updateInstitutionalReportStatus(selected.id, nextStatus, comment);
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(nextStatus === "approved" ? (t(locale, "organization.reports.report_approved")) : nextStatus === "changes_requested" ? (t(locale, "organization.reports.changes_requested")) : (t(locale, "organization.reports.review_saved")));
    setSelected(null); setComment(""); await load();
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.reports.report_review")} description={t(locale, "organization.reports.centralize_submissions_comments_change_requests_and_approvals_with_a_complete_hi")} />
    <Card className="mb-5"><CardContent className="grid gap-3 sm:grid-cols-[1fr_230px]"><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t(locale, "organization.reports.search_student_or_report")} /></div><Select value={status} onValueChange={setStatus} options={[{ value: "pending", label: t(locale, "organization.reports.needs_action") }, { value: "all", label: t(locale, "organization.reports.all_statuses") }, { value: "draft", label: t(locale, "organization.reports.drafts") }, { value: "submitted", label: t(locale, "organization.reports.submitted") }, { value: "in_review", label: t(locale, "organization.reports.in_review") }, { value: "changes_requested", label: t(locale, "organization.reports.changes_requested_2") }, { value: "approved", label: t(locale, "organization.reports.approved") }]} /></CardContent></Card>
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" /> : filtered.length ? <Card><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse"><thead><tr className="border-b border-border bg-surface-muted/50 text-left text-[11px] font-extrabold uppercase tracking-[.1em] text-muted"><th className="px-5 py-3">{t(locale, "organization.reports.student")}</th><th className="px-5 py-3">{t(locale, "organization.reports.report")}</th><th className="px-5 py-3">{t(locale, "organization.reports.period")}</th><th className="px-5 py-3">{t(locale, "organization.reports.status")}</th><th className="px-5 py-3 text-right">{t(locale, "organization.reports.action")}</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-muted/35"><td className="px-5 py-4 font-bold">{item.studentName || "—"}</td><td className="px-5 py-4"><div className="font-semibold">{item.title}</div><div className="mt-1 text-xs text-muted">{item.reportType}</div></td><td className="px-5 py-4 text-sm text-muted">{item.periodLabel || "—"}</td><td className="px-5 py-4"><StatusBadge status={item.status} locale={locale} /></td><td className="px-5 py-4 text-right"><Button size="sm" variant="secondary" onClick={() => { setSelected(item); setComment(""); }}><FileCheck2 className="size-4" />{t(locale, "organization.reports.open")}</Button></td></tr>)}</tbody></table></div></Card> : <EmptyState icon={FileCheck2} title={t(locale, "organization.reports.no_reports_in_this_view")} description={t(locale, "organization.reports.submissions_will_appear_automatically_based_on_templates_and_deadlines")} />}
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || (t(locale, "organization.reports.review_report"))} description={selected ? `${selected.studentName} · ${selected.periodLabel}` : undefined} size="lg" footer={<><Button variant="secondary" onClick={() => setSelected(null)}>{t(locale, "organization.reports.close")}</Button><Button variant="danger" onClick={() => void review("changes_requested")} disabled={saving}><XCircle className="size-4" />{t(locale, "organization.reports.request_changes")}</Button><Button variant="success" onClick={() => void review("approved")} disabled={saving}><CheckCircle2 className="size-4" />{t(locale, "organization.reports.approve")}</Button></>}>
      {selected ? <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><Info label={t(locale, "organization.reports.type")} value={selected.reportType} /><Info label={t(locale, "organization.reports.status")} value={<StatusBadge status={selected.status} locale={locale} />} /><Info label={t(locale, "organization.reports.submitted")} value={selected.submittedAt ? new Intl.DateTimeFormat(t(locale, "organization.reports.en_ca"), { dateStyle: "medium", timeStyle: "short" }).format(new Date(selected.submittedAt)) : "—"} /></div><div><FieldLabel>{t(locale, "organization.reports.review_comment")}</FieldLabel><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t(locale, "organization.reports.comment_visible_to_the_student")} /><div className="mt-2 flex items-center gap-2 text-xs text-muted"><MessageSquareText className="size-3.5" />{t(locale, "organization.reports.the_comment_will_be_added_to_the_report_history")}</div></div></div> : null}
    </Modal>
  </OrganizationRequired>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border border-border bg-background p-3"><div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-muted">{label}</div><div className="mt-1.5 text-sm font-bold">{value}</div></div>; }
