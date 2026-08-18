"use client";

import { translate as t } from "@/i18n";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Clipboard, MailPlus, Plus, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { OrganizationRequired } from "@/components/organization/organization-required";
import { StatusBadge } from "@/components/organization/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  createInvitation,
  listCohorts,
  listInvitations,
  listPrograms,
  roleLabel,
  type OrganizationCohort,
  type OrganizationInvitation,
  type OrganizationProgram,
  type OrganizationRoleKey,
} from "@/lib/organization";
import { useWorkspace } from "@/lib/workspace";

export default function InvitationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [items, setItems] = useState<OrganizationInvitation[]>([]);
  const [programs, setPrograms] = useState<OrganizationProgram[]>([]);
  const [cohorts, setCohorts] = useState<OrganizationCohort[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState("");
  const [form, setForm] = useState({ email: "", roleKey: "student" as OrganizationRoleKey, programId: "", cohortId: "", expiresInDays: "14" });

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const [invitations, programRows, cohortRows] = await Promise.all([
      listInvitations(organizationId),
      listPrograms(organizationId),
      listCohorts(organizationId),
    ]);
    setItems(invitations); setPrograms(programRows); setCohorts(cohortRows); setLoading(false);
  }, [organizationId]);
  useEffect(() => { void load(); }, [load]);

  const cohortOptions = useMemo(() => cohorts.filter((cohort) => !form.programId || cohort.programId === form.programId), [cohorts, form.programId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!organizationId || !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error(t(locale, "organization.invitations.enter_a_valid_email_address"));
      return;
    }
    setSaving(true);
    const result = await createInvitation(organizationId, {
      email: form.email.trim().toLowerCase(), roleKey: form.roleKey, programId: form.programId || undefined, cohortId: form.cohortId || undefined, expiresInDays: Number(form.expiresInDays) || 14, locale,
    });
    setSaving(false);
    if (result.error) return toast.error(result.error.message);
    const payload = result.data as Record<string, unknown> | string | null;
    const invitationUrl = typeof payload === "object" && payload ? String(payload.invitation_url || "") : "";
    const token = typeof payload === "object" && payload ? String(payload.token || payload.invitation_token || "") : typeof payload === "string" ? payload : "";
    const link = invitationUrl || (token ? `${window.location.origin}/${locale}/invite/${encodeURIComponent(token)}` : "");
    setGeneratedLink(link);
    const delivered = typeof payload === "object" && payload ? Boolean(payload.delivered) : false;
    toast.success(delivered ? (t(locale, "organization.invitations.invitation_created_and_sent")) : (t(locale, "organization.invitations.invitation_created_the_link_can_be_copied")));
    await load();
  }

  async function copyLink() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    toast.success(t(locale, "organization.invitations.link_copied"));
  }

  return <OrganizationRequired locale={locale}>
    <PageHeader title={t(locale, "organization.invitations.invitations")} description={t(locale, "organization.invitations.assign_role_program_and_cohort_before_sign_up_practicora_will_then_automatically")} actions={<Button onClick={() => { setGeneratedLink(""); setOpen(true); }}><Plus className="size-4" />{t(locale, "organization.invitations.new_invitation")}</Button>} />
    <div className="mb-5 grid gap-4 lg:grid-cols-3">
      <Card><CardContent><span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary"><ShieldCheck className="size-5" /></span><h2 className="mt-4 font-extrabold">{t(locale, "organization.invitations.verified_role")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t(locale, "organization.invitations.recipients_cannot_assign_themselves_a_higher_role_than_the_one_defined_in_the_in")}</p></CardContent></Card>
      <Card><CardContent><span className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info"><Send className="size-5" /></span><h2 className="mt-4 font-extrabold">{t(locale, "organization.invitations.secure_link")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t(locale, "organization.invitations.only_a_hashed_version_of_the_token_is_stored_and_it_expires_automatically")}</p></CardContent></Card>
      <Card><CardContent><span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success"><MailPlus className="size-5" /></span><h2 className="mt-4 font-extrabold">{t(locale, "organization.invitations.automated_delivery")}</h2><p className="mt-2 text-sm leading-6 text-muted">{t(locale, "organization.invitations.a_supabase_function_is_included_to_email_the_link_when_a_delivery_service_is_con")}</p></CardContent></Card>
    </div>
    {loading ? <div className="h-56 animate-pulse rounded-2xl bg-surface-muted" /> : items.length ? <Card><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse"><thead><tr className="border-b border-border bg-surface-muted/50 text-left text-[11px] font-extrabold uppercase tracking-[.1em] text-muted"><th className="px-5 py-3">{t(locale, "organization.invitations.email")}</th><th className="px-5 py-3">{t(locale, "organization.invitations.role")}</th><th className="px-5 py-3">{t(locale, "organization.invitations.status")}</th><th className="px-5 py-3">{t(locale, "organization.invitations.expires")}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border last:border-0"><td className="px-5 py-4 font-semibold">{item.email}</td><td className="px-5 py-4 text-sm">{roleLabel(item.roleKey, locale)}</td><td className="px-5 py-4"><StatusBadge status={item.status} locale={locale} /></td><td className="px-5 py-4 text-sm text-muted">{new Intl.DateTimeFormat(t(locale, "organization.invitations.en_ca"), { dateStyle: "medium" }).format(new Date(item.expiresAt))}</td></tr>)}</tbody></table></div></Card> : <EmptyState icon={MailPlus} title={t(locale, "organization.invitations.no_invitations")} description={t(locale, "organization.invitations.invite_a_student_teacher_program_manager_or_supervisor")} action={<Button onClick={() => setOpen(true)}>{t(locale, "organization.invitations.create_invitation")}</Button>} />}
    <Modal open={open} onClose={() => setOpen(false)} title={t(locale, "organization.invitations.new_invitation")} description={t(locale, "organization.invitations.the_email_must_match_the_account_accepting_the_invitation")} footer={generatedLink ? <Button onClick={() => void copyLink()}><Clipboard className="size-4" />{t(locale, "organization.invitations.copy_link")}</Button> : <><Button variant="secondary" onClick={() => setOpen(false)}>{t(locale, "organization.invitations.cancel")}</Button><Button form="invitation-form" type="submit" disabled={saving}>{saving ? (t(locale, "organization.invitations.creating")) : (t(locale, "organization.invitations.create_invitation_2"))}</Button></>}>
      {generatedLink ? <div className="rounded-2xl border border-success/20 bg-success/8 p-4"><h3 className="font-extrabold text-success">{t(locale, "organization.invitations.invitation_ready")}</h3><p className="mt-2 break-all text-sm leading-6 text-muted-strong">{generatedLink}</p><FieldHint>{t(locale, "organization.invitations.copy_this_link_or_use_the_included_email_delivery_function")}</FieldHint></div> : <form id="invitation-form" className="space-y-4" onSubmit={submit}>
        <div><FieldLabel>{t(locale, "organization.invitations.email_address")}</FieldLabel><Input type="email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} placeholder={t(locale, "organization.invitations.email_placeholder")} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><FieldLabel>{t(locale, "organization.invitations.role")}</FieldLabel><Select value={form.roleKey} onValueChange={(value) => setForm((v) => ({ ...v, roleKey: value as OrganizationRoleKey }))} options={[{ value: "admin", label: t(locale, "organization.invitations.administrator") }, { value: "program_manager", label: t(locale, "organization.invitations.program_manager") }, { value: "teacher", label: t(locale, "organization.invitations.teacher") }, { value: "supervisor", label: t(locale, "organization.invitations.supervisor") }, { value: "student", label: t(locale, "organization.invitations.student") }]} /></div><div><FieldLabel>{t(locale, "organization.invitations.expiration")}</FieldLabel><Select value={form.expiresInDays} onValueChange={(expiresInDays) => setForm((v) => ({ ...v, expiresInDays }))} options={[{ value: "7", label: t(locale, "organization.invitations.text_7_days") }, { value: "14", label: t(locale, "organization.invitations.text_14_days") }, { value: "30", label: t(locale, "organization.invitations.text_30_days") }]} /></div></div>
        <div><FieldLabel>{t(locale, "organization.invitations.optional_program")}</FieldLabel><Select value={form.programId} onValueChange={(programId) => setForm((v) => ({ ...v, programId, cohortId: "" }))} options={[{ value: "", label: t(locale, "organization.invitations.no_program") }, ...programs.map((item) => ({ value: item.id, label: item.name, description: item.code }))]} /></div>
        <div><FieldLabel>{t(locale, "organization.invitations.optional_cohort")}</FieldLabel><Select value={form.cohortId} onValueChange={(cohortId) => setForm((v) => ({ ...v, cohortId }))} options={[{ value: "", label: t(locale, "organization.invitations.no_cohort") }, ...cohortOptions.map((item) => ({ value: item.id, label: item.name, description: item.programName }))]} /></div>
      </form>}
    </Modal>
  </OrganizationRequired>;
}
