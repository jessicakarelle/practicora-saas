"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Plus, ShieldCheck, Trash2, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { ActionReasonDialog } from "@/components/platform/action-reason-dialog";
import { PlatformRequired } from "@/components/platform/platform-required";
import { StatusPill } from "@/components/platform/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { assignPlatformRole, listPlatformTeam, removePlatformRole, type PlatformRoleKey, type PlatformTeamMember } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

const roleKeys: PlatformRoleKey[] = ["platform_owner", "platform_admin", "platform_operations", "platform_finance", "platform_support", "platform_auditor"];

export default function PlatformAccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [team, setTeam] = useState<PlatformTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRoleKey>("platform_operations");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ member: PlatformTeamMember; role: PlatformRoleKey } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setTeam(await listPlatformTeam());
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const canManage = hasPlatformPermission("platform.access.manage");
  const roleOptions = useMemo(() => roleKeys.map((key) => ({ value: key, label: t(locale, `platform.roles.${key}`), description: t(locale, `platform.roles.${key.replace("platform_", "")}_description`) })), [locale]);

  async function assign() {
    if (!email.trim() || !canManage) return;
    setBusy(true);
    try {
      await assignPlatformRole(email.trim(), role, notes.trim());
      toast.success(t(locale, "platform.access.assigned"));
      setEmail("");
      setNotes("");
      await load();
    } catch {
      toast.error(t(locale, "platform.access.assign_error"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(reason: string) {
    if (!pending) return;
    setBusy(true);
    try {
      await removePlatformRole(pending.member.userId, pending.role, reason);
      toast.success(t(locale, "platform.access.removed"));
      setPending(null);
      await load();
    } catch {
      toast.error(t(locale, "platform.access.remove_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PlatformRequired locale={locale} permission="platform.access.view">
      <PageHeader title={t(locale, "platform.access.title")} description={t(locale, "platform.access.description")} />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.access.invite_title")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.access.last_owner_protected")}</p></div><KeyRound className="size-5 text-primary" /></CardHeader>
          <CardContent className="space-y-4">
            <div><FieldLabel>{t(locale, "platform.access.email")}</FieldLabel><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t(locale, "platform.access.email_placeholder")} /></div>
            <div><FieldLabel>{t(locale, "platform.access.role")}</FieldLabel><Select value={role} onValueChange={(value) => setRole(value as PlatformRoleKey)} options={roleOptions} /></div>
            <div><FieldLabel>{t(locale, "platform.access.notes")}</FieldLabel><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24" placeholder={t(locale, "platform.access.notes_placeholder")} /></div>
            <Button className="w-full" disabled={!canManage || busy || !email.trim()} onClick={() => void assign()}><Plus className="size-4" />{busy ? t(locale, "common.navigation.saving") : t(locale, "platform.access.add")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.access.team")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.access.description")}</p></div><UserRoundCog className="size-5 text-primary" /></CardHeader>
          <CardContent className="space-y-3">
            {loading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />) : team.length ? team.map((member) => (
              <div key={member.membershipId} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><ShieldCheck className="size-4.5" /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-extrabold">{member.fullName || member.email}</h3><StatusPill label={t(locale, `common.navigation.${member.status}`)} status={member.status} /></div><p className="mt-1 truncate text-sm text-muted">{member.email}</p><div className="mt-3 flex flex-wrap gap-2">{member.roles.map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">{t(locale, `platform.roles.${item}`)}{canManage ? <button type="button" onClick={() => setPending({ member, role: item })} className="rounded-full p-0.5 hover:bg-danger/10 hover:text-danger" aria-label={t(locale, "platform.access.remove")}><Trash2 className="size-3" /></button> : null}</span>)}</div></div>
                  <div className="text-xs text-muted sm:text-right"><div>{t(locale, "platform.access.permissions")}: <strong className="text-foreground">{member.permissions.length}</strong></div><div className="mt-1">{t(locale, "platform.access.last_used")}: {member.lastUsedAt ? new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(member.lastUsedAt)) : t(locale, "common.navigation.never")}</div></div>
                </div>
              </div>
            )) : <div className="py-12 text-center text-sm text-muted">{t(locale, "platform.access.empty")}</div>}
          </CardContent>
        </Card>
      </div>
      <ActionReasonDialog locale={locale} open={Boolean(pending)} title={t(locale, "platform.access.remove_title")} description={t(locale, "platform.access.remove_description")} confirmLabel={t(locale, "platform.access.remove")} busy={busy} onClose={() => !busy && setPending(null)} onConfirm={remove} />
    </PlatformRequired>
  );
}
