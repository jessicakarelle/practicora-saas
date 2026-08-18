"use client";

import { use, useCallback, useEffect, useState } from "react";
import { FlaskConical, Gauge, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldHint } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { listPlatformFeatureFlags, updatePlatformFeatureFlag, type PlatformFeatureFlag } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformFeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [flags, setFlags] = useState<PlatformFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const load = useCallback(async () => { setLoading(true); setFlags(await listPlatformFeatureFlags()); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const canManage = hasPlatformPermission("platform.features.manage");

  async function save(flag: PlatformFeatureFlag, patch: Partial<PlatformFeatureFlag>) {
    const next = { ...flag, ...patch };
    setFlags((current) => current.map((item) => item.key === flag.key ? next : item));
    if (!canManage) return;
    setSaving(flag.key);
    try {
      await updatePlatformFeatureFlag(next.key, next.enabled, next.rolloutPercentage, t(locale, "platform.features.autosave"));
      toast.success(t(locale, "platform.features.saved"));
    } catch {
      toast.error(t(locale, "platform.features.operation_failed"));
      await load();
    } finally {
      setSaving("");
    }
  }

  function label(flag: PlatformFeatureFlag, suffix: "name" | "description") {
    const translated = t(locale, `platform.flags.${flag.key}_${suffix}`);
    return translated.startsWith("platform.flags.") ? (suffix === "name" ? flag.nameKey : flag.descriptionKey) : translated;
  }

  return <PlatformRequired locale={locale} permission="platform.features.view"><PageHeader title={t(locale, "platform.features.title")} description={t(locale, "platform.features.description")} /><div className="grid gap-5 xl:grid-cols-2">{loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-surface-muted" />) : flags.map((flag) => <Card key={flag.key}><CardHeader><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold">{label(flag, "name")}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${flag.enabled ? "bg-success/10 text-success" : "bg-surface-muted text-muted-strong"}`}>{flag.enabled ? t(locale, "platform.features.enabled") : t(locale, "platform.features.disabled")}</span></div><p className="mt-1 text-sm leading-6 text-muted">{label(flag, "description")}</p></div><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><FlaskConical className="size-4.5" /></span></CardHeader><CardContent className="space-y-5"><div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5"><div><div className="text-sm font-extrabold">{flag.enabled ? t(locale, "platform.features.enabled") : t(locale, "platform.features.disabled")}</div><code className="mt-1 block text-xs text-muted">{flag.key}</code></div><Switch disabled={!canManage || saving === flag.key} checked={flag.enabled} onCheckedChange={(enabled) => void save(flag, { enabled })} /></div><div><div className="flex items-center justify-between gap-3 text-sm font-extrabold"><span className="inline-flex items-center gap-2"><Gauge className="size-4 text-primary" />{t(locale, "platform.features.rollout")}</span><span className="tabular-nums text-primary">{flag.rolloutPercentage}%</span></div><input disabled={!canManage || saving === flag.key} type="range" min={0} max={100} step={5} value={flag.rolloutPercentage} onChange={(event) => setFlags((current) => current.map((item) => item.key === flag.key ? { ...item, rolloutPercentage: Number(event.target.value) } : item))} onPointerUp={(event) => void save(flag, { rolloutPercentage: Number((event.currentTarget as HTMLInputElement).value) })} onKeyUp={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) void save(flag, { rolloutPercentage: Number(event.currentTarget.value) }); }} className="mt-3 w-full accent-[var(--primary)]" /><FieldHint>{t(locale, "platform.features.rollout_help")}</FieldHint></div><div className="flex items-center gap-2 border-t border-border pt-4 text-xs font-bold text-muted"><Sparkles className="size-3.5 text-primary" />{saving === flag.key ? t(locale, "common.navigation.saving") : t(locale, "platform.features.autosave")}</div></CardContent></Card>)}</div></PlatformRequired>;
}
