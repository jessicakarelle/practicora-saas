"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleDollarSign, Clock3, Globe2, Layers3, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { localeTag, translate as t } from "@/i18n";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { listPlatformPlans, updatePlatformPlan, updatePlatformPlanFeature, type PlatformPlan } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

export default function PlatformPlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { hasPlatformPermission } = useWorkspace();
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const timers = useRef<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setPlans(await listPlatformPlans());
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
    const currentTimers = timers.current;
    return () => Object.values(currentTimers).forEach((timer) => window.clearTimeout(timer));
  }, [load]);

  const canManage = hasPlatformPermission("platform.plans.manage");
  const canPublish = hasPlatformPermission("platform.plans.publish");
  const statusOptions = useMemo(() => [
    { value: "draft", label: t(locale, "platform.plans.draft") },
    { value: "active", label: t(locale, "platform.plans.active") },
    { value: "archived", label: t(locale, "platform.plans.archived") },
  ], [locale]);

  function patchPlan(planId: string, patch: Partial<PlatformPlan>) {
    setPlans((current) => current.map((plan) => plan.id === planId ? { ...plan, ...patch } : plan));
  }

  async function savePlan(plan: PlatformPlan) {
    if (!canManage) return;
    setSavingId(plan.id);
    try {
      await updatePlatformPlan(plan.id, plan.status, plan.isPublic, plan.trialDays, t(locale, "platform.plans.autosave"));
      toast.success(t(locale, "platform.plans.saved"));
    } catch {
      toast.error(t(locale, "platform.plans.save_error"));
      await load();
    } finally {
      setSavingId("");
    }
  }

  function schedulePlanSave(planId: string) {
    if (timers.current[planId]) window.clearTimeout(timers.current[planId]);
    timers.current[planId] = window.setTimeout(() => {
      const plan = plans.find((item) => item.id === planId);
      if (plan) void savePlan(plan);
    }, 650);
  }

  async function saveFeature(planId: string, key: string, value: unknown) {
    if (!canManage) return;
    const featureTimer = `${planId}:${key}`;
    if (timers.current[featureTimer]) window.clearTimeout(timers.current[featureTimer]);
    timers.current[featureTimer] = window.setTimeout(async () => {
      setSavingId(featureTimer);
      try {
        await updatePlatformPlanFeature(planId, key, value);
        toast.success(t(locale, "platform.plans.saved"));
      } catch {
        toast.error(t(locale, "platform.plans.save_error"));
        await load();
      } finally {
        setSavingId("");
      }
    }, 550);
  }

  function planName(plan: PlatformPlan) {
    const key = `platform.plans.plan_${plan.code}`;
    const translated = t(locale, key);
    return translated === key ? plan.code : translated;
  }
  function planDescription(plan: PlatformPlan) {
    const key = `platform.plans.description_${plan.code}`;
    const translated = t(locale, key);
    return translated === key ? plan.descriptionKey : translated;
  }
  function featureLabel(key: string) {
    const translated = t(locale, `billing.features.${key.replaceAll(".", "_")}`);
    return translated.startsWith("billing.features.") ? key : translated;
  }

  return (
    <PlatformRequired locale={locale} permission="platform.plans.view">
      <PageHeader title={t(locale, "platform.plans.title")} description={t(locale, "platform.plans.description")} />
      <div className="grid gap-5 xl:grid-cols-2">
        {loading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[520px] animate-pulse rounded-2xl bg-surface-muted" />) : plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{planName(plan)}</h2><span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-extrabold text-primary">{t(locale, `platform.plans.${plan.audience}`)}</span></div><p className="mt-1 text-sm leading-6 text-muted">{planDescription(plan)}</p></div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Layers3 className="size-4.5" /></span>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div><FieldLabel>{t(locale, "common.navigation.status")}</FieldLabel><Select disabled={!canManage} value={plan.status} onValueChange={(value) => { patchPlan(plan.id, { status: value as PlatformPlan["status"] }); window.setTimeout(() => schedulePlanSave(plan.id), 0); }} options={statusOptions} /></div>
                <div><FieldLabel>{t(locale, "platform.plans.trial_days")}</FieldLabel><div className="relative"><Clock3 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input disabled={!canManage} type="number" min={0} max={365} value={plan.trialDays} onChange={(event) => patchPlan(plan.id, { trialDays: Number(event.target.value) })} onBlur={() => void savePlan(plans.find((item) => item.id === plan.id) || plan)} className="pl-10" /></div></div>
                <div><FieldLabel>{t(locale, "platform.plans.publish")}</FieldLabel><div className="flex h-11 items-center justify-between rounded-xl border border-border bg-background px-3"><span className="text-sm font-bold">{plan.isPublic ? t(locale, "platform.plans.public") : t(locale, "platform.plans.private")}</span><Switch disabled={!canManage || !canPublish} checked={plan.isPublic} onCheckedChange={(isPublic) => { patchPlan(plan.id, { isPublic }); window.setTimeout(() => schedulePlanSave(plan.id), 0); }} ariaLabel={t(locale, "platform.plans.publish")} /></div></div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-extrabold">{t(locale, "platform.plans.prices")}</h3><p className="mt-0.5 text-xs text-muted">{t(locale, "platform.plans.autosave")}</p></div><CircleDollarSign className="size-4.5 text-primary" /></div>
                <div className="grid gap-3 sm:grid-cols-2">{plan.prices.length ? plan.prices.map((price) => <div key={price.id} className="rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-3"><span className="text-lg font-extrabold tabular-nums">{new Intl.NumberFormat(localeTag(locale), { style: "currency", currency: price.currency }).format(price.amountCents / 100)}</span><Globe2 className="size-4 text-muted" /></div><p className="mt-1 text-xs font-bold text-muted">{t(locale, `platform.plans.${price.billingInterval === "month" ? "monthly" : price.billingInterval === "year" ? "yearly" : price.billingInterval}`)}</p></div>) : <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted sm:col-span-2">{t(locale, "platform.plans.no_price")}</div>}</div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">{t(locale, "platform.plans.features")}</h3><Sparkles className="size-4.5 text-primary" /></div>
                <div className="space-y-2.5">{plan.features.map((feature) => {
                  const value = feature.value;
                  const boolean = feature.valueType === "boolean";
                  return <div key={feature.key} className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"><div className="min-w-0"><div className="truncate text-sm font-extrabold">{featureLabel(feature.key)}</div><code className="mt-1 block truncate text-[11px] text-muted">{feature.key}</code></div>{boolean ? <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2"><span className="text-xs font-bold">{value ? t(locale, "platform.plans.enabled") : t(locale, "platform.plans.disabled")}</span><Switch disabled={!canManage} checked={Boolean(value)} onCheckedChange={(next) => { setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, features: item.features.map((f) => f.key === feature.key ? { ...f, value: next } : f) } : item)); void saveFeature(plan.id, feature.key, next); }} /></div> : <Input disabled={!canManage} value={String(value ?? "")} onChange={(event) => { const next = feature.valueType === "integer" || feature.valueType === "decimal" ? Number(event.target.value) : event.target.value; setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, features: item.features.map((f) => f.key === feature.key ? { ...f, value: next } : f) } : item)); }} onBlur={(event) => { const next = feature.valueType === "integer" || feature.valueType === "decimal" ? Number(event.target.value) : event.target.value; void saveFeature(plan.id, feature.key, next); }} />}</div>;
                })}</div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4"><FieldHint>{t(locale, "platform.plans.autosave")}</FieldHint>{savingId.startsWith(plan.id) || savingId === plan.id ? <span className="inline-flex items-center gap-2 text-xs font-bold text-primary"><Save className="size-3.5 animate-pulse" />{t(locale, "common.navigation.saving")}</span> : null}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PlatformRequired>
  );
}
