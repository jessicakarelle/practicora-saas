"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleDollarSign, Database, Save, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { listPlatformSettings, updatePlatformSetting, type PlatformSetting } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

type EditableSettings = {
  supportMinutes: number;
  billingProvider: string;
  billingCurrency: string;
  billingMode: string;
  exportExpiryHours: number;
  deletionGraceDays: number;
};

const defaults: EditableSettings = { supportMinutes: 30, billingProvider: "manual", billingCurrency: "CAD", billingMode: "observe", exportExpiryHours: 24, deletionGraceDays: 30 };

export default function PlatformSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [settings, setSettings] = useState(defaults);
  const [raw, setRaw] = useState<PlatformSetting[]>([]);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const canManage = hasPlatformPermission("platform.settings.manage");

  const load = useCallback(async () => {
    const rows = await listPlatformSettings();
    setRaw(rows);
    const security = rows.find((row) => row.key === "platform.security")?.value || {};
    const billing = rows.find((row) => row.key === "platform.billing")?.value || {};
    const data = rows.find((row) => row.key === "platform.data")?.value || {};
    setSettings({
      supportMinutes: Number(security.support_session_minutes || 30),
      billingProvider: String(billing.provider || "manual"),
      billingCurrency: String(billing.currency || "CAD"),
      billingMode: String(billing.enforcement_mode || "observe"),
      exportExpiryHours: Number(data.export_expiry_hours || 24),
      deletionGraceDays: Number(data.deletion_grace_days || 30),
    });
  }, []);
  useEffect(() => { void load(); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, [load]);

  async function persist(next: EditableSettings) {
    if (!canManage) return;
    setSaving(true);
    try {
      await Promise.all([
        updatePlatformSetting("platform.security", { support_session_minutes: next.supportMinutes, require_reason: true, require_reauthentication: true }),
        updatePlatformSetting("platform.billing", { provider: next.billingProvider, currency: next.billingCurrency, enforcement_mode: next.billingMode }),
        updatePlatformSetting("platform.data", { export_expiry_hours: next.exportExpiryHours, deletion_grace_days: next.deletionGraceDays }),
      ]);
      toast.success(t(locale, "platform.settings.saved"));
      await load();
    } catch { toast.error(t(locale, "platform.settings.save_error")); }
    finally { setSaving(false); }
  }
  function update(patch: Partial<EditableSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(next), 700);
  }
  const providerOptions = useMemo(() => [{ value: "manual", label: t(locale, "platform.settings.manual") }, { value: "stripe", label: t(locale, "platform.settings.stripe") }], [locale]);
  const modeOptions = useMemo(() => [{ value: "observe", label: t(locale, "platform.settings.observe") }, { value: "enforce", label: t(locale, "platform.settings.enforce") }], [locale]);

  return <PlatformRequired locale={locale} permission="platform.settings.view"><PageHeader title={t(locale, "platform.settings.title")} description={t(locale, "platform.settings.description")} /><div className="grid gap-5 xl:grid-cols-3"><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.settings.security_section")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.security.support_sessions_description")}</p></div><ShieldCheck className="size-5 text-primary" /></CardHeader><CardContent><FieldLabel>{t(locale, "platform.settings.support_duration")}</FieldLabel><div className="relative"><Input disabled={!canManage} type="number" min={5} max={120} value={settings.supportMinutes} onChange={(event) => update({ supportMinutes: Number(event.target.value) })} /><span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-bold text-muted">{t(locale, "platform.settings.minutes")}</span></div></CardContent></Card><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.settings.billing_section")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.settings.billing_mode")}</p></div><CircleDollarSign className="size-5 text-primary" /></CardHeader><CardContent className="space-y-4"><div><FieldLabel>{t(locale, "platform.settings.provider")}</FieldLabel><Select disabled={!canManage} value={settings.billingProvider} onValueChange={(value) => update({ billingProvider: value })} options={providerOptions} /></div><div><FieldLabel>{t(locale, "platform.settings.currency")}</FieldLabel><Select disabled={!canManage} value={settings.billingCurrency} onValueChange={(value) => update({ billingCurrency: value })} options={["CAD","USD","EUR"].map((value) => ({ value, label: value }))} /></div><div><FieldLabel>{t(locale, "platform.settings.billing_mode")}</FieldLabel><Select disabled={!canManage} value={settings.billingMode} onValueChange={(value) => update({ billingMode: value })} options={modeOptions} /></div></CardContent></Card><Card><CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.settings.data_section")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.data.description")}</p></div><Database className="size-5 text-primary" /></CardHeader><CardContent className="space-y-4"><div><FieldLabel>{t(locale, "platform.settings.export_expiry")}</FieldLabel><div className="relative"><Input disabled={!canManage} type="number" min={1} max={168} value={settings.exportExpiryHours} onChange={(event) => update({ exportExpiryHours: Number(event.target.value) })} /><span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-bold text-muted">{t(locale, "common.misc.hour_short")}</span></div></div><div><FieldLabel>{t(locale, "platform.settings.deletion_grace")}</FieldLabel><div className="relative"><Input disabled={!canManage} type="number" min={1} max={365} value={settings.deletionGraceDays} onChange={(event) => update({ deletionGraceDays: Number(event.target.value) })} /><span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-bold text-muted">{t(locale, "platform.settings.days")}</span></div></div></CardContent></Card></div><Card className="mt-5"><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">{saving ? <Save className="size-4.5 animate-pulse" /> : <Settings2 className="size-4.5" />}</span><div className="min-w-0 flex-1"><div className="font-extrabold">{saving ? t(locale, "common.navigation.saving") : t(locale, "platform.settings.saved_automatically")}</div><FieldHint>{raw.length ? `${raw.length} ${t(locale, "common.navigation.details").toLowerCase()}` : t(locale, "platform.settings.read_only")}</FieldHint></div></CardContent></Card></PlatformRequired>;
}
