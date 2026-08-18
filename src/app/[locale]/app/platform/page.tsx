"use client";

import { use, useEffect, useState } from "react";
import {
  Activity,
  Building2,
  CircleDollarSign,
  Database,
  FileClock,
  LifeBuoy,
  ShieldCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { localeTag, translate as t } from "@/i18n";
import { MetricCard } from "@/components/app/metric-card";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { loadPlatformDashboard, type PlatformDashboardMetrics } from "@/lib/platform";
import { useWorkspace } from "@/lib/workspace";

const empty: PlatformDashboardMetrics = {
  organizationsTotal: 0,
  organizationsActive: 0,
  organizationsSuspended: 0,
  usersTotal: 0,
  usersActive30d: 0,
  usersSuspended: 0,
  subscriptionsActive: 0,
  subscriptionsPastDue: 0,
  reportsWaiting: 0,
  supportSessionsActive: 0,
  dataRequestsOpen: 0,
  auditEvents24h: 0,
};

export default function PlatformDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { context } = useWorkspace();
  const [metrics, setMetrics] = useState(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadPlatformDashboard().then((next) => {
      if (!cancelled) {
        setMetrics(next);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const value = (number: number) => loading ? "—" : new Intl.NumberFormat(localeTag(locale)).format(number);

  return (
    <PlatformRequired locale={locale} permission="platform.dashboard.view">
      <PageHeader
        title={t(locale, "platform.dashboard.title")}
        description={t(locale, "platform.dashboard.description")}
        actions={<ButtonLink href={`/${locale}/app/platform/access`}><ShieldCheck className="size-4" />{t(locale, "platform.dashboard.platform_owner_badge")}</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Building2} label={t(locale, "platform.dashboard.organizations")} value={value(metrics.organizationsTotal)} meta={`${value(metrics.organizationsActive)} ${t(locale, "platform.dashboard.active_organizations").toLowerCase()}`} />
        <MetricCard icon={Users} label={t(locale, "platform.dashboard.users")} value={value(metrics.usersTotal)} meta={`${value(metrics.usersActive30d)} ${t(locale, "platform.dashboard.active_users_30d").toLowerCase()}`} tone="info" />
        <MetricCard icon={CircleDollarSign} label={t(locale, "platform.dashboard.active_subscriptions")} value={value(metrics.subscriptionsActive)} meta={`${value(metrics.subscriptionsPastDue)} ${t(locale, "platform.dashboard.past_due").toLowerCase()}`} tone={metrics.subscriptionsPastDue ? "warning" : "success"} />
        <MetricCard icon={Activity} label={t(locale, "platform.dashboard.audit_events")} value={value(metrics.auditEvents24h)} meta={t(locale, "platform.dashboard.security_posture")} tone="success" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.dashboard.critical_queues")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.dashboard.critical_queues_description")}</p></div></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <QueueItem locale={locale} icon={ShieldCheck} label={t(locale, "platform.dashboard.risk_signal")} value={metrics.usersSuspended + metrics.organizationsSuspended} href="security" tone={(metrics.usersSuspended + metrics.organizationsSuspended) > 0 ? "danger" : "success"} />
            <QueueItem locale={locale} icon={FileClock} label={t(locale, "platform.dashboard.reports_waiting")} value={metrics.reportsWaiting} href="institutions" tone={metrics.reportsWaiting ? "warning" : "success"} />
            <QueueItem locale={locale} icon={LifeBuoy} label={t(locale, "platform.dashboard.support_sessions")} value={metrics.supportSessionsActive} href="support" tone={metrics.supportSessionsActive ? "warning" : "success"} />
            <QueueItem locale={locale} icon={Database} label={t(locale, "platform.dashboard.data_requests")} value={metrics.dataRequestsOpen} href="data" tone={metrics.dataRequestsOpen ? "warning" : "success"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div><h2 className="text-lg font-extrabold">{t(locale, "platform.dashboard.platform_owner_badge")}</h2><p className="mt-1 text-sm text-muted">{t(locale, "platform.dashboard.owner_scope")}</p></div><UserRoundCog className="size-5 text-primary" /></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {context.platform.roles.map((role) => <span key={role} className="rounded-full border border-primary/15 bg-primary-softer px-2.5 py-1 text-xs font-extrabold text-primary">{t(locale, `platform.roles.${role}`)}</span>)}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ButtonLink href={`/${locale}/app/platform/institutions`} variant="secondary" className="justify-start"><Building2 className="size-4" />{t(locale, "platform.dashboard.go_institutions")}</ButtonLink>
              <ButtonLink href={`/${locale}/app/platform/users`} variant="secondary" className="justify-start"><Users className="size-4" />{t(locale, "platform.dashboard.go_users")}</ButtonLink>
              <ButtonLink href={`/${locale}/app/platform/access`} variant="secondary" className="justify-start"><ShieldCheck className="size-4" />{t(locale, "platform.dashboard.go_access")}</ButtonLink>
              <ButtonLink href={`/${locale}/app/platform/plans`} variant="secondary" className="justify-start"><CircleDollarSign className="size-4" />{t(locale, "platform.dashboard.go_plans")}</ButtonLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformRequired>
  );
}

function QueueItem({ locale, icon: Icon, label, value, href, tone }: { locale: string; icon: typeof ShieldCheck; label: string; value: number; href: string; tone: "success" | "warning" | "danger" }) {
  const styles = { success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", danger: "bg-danger/10 text-danger" } as const;
  return (
    <a href={`/${locale}/app/platform/${href}`} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 hover:border-primary/25 hover:bg-primary-softer/30">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="size-4.5" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{label}</span><span className="mt-0.5 block text-xs text-muted">{value ? value : t(locale, "platform.dashboard.all_clear")}</span></span>
      <span className="text-sm font-extrabold text-primary">{t(locale, "platform.dashboard.open")}</span>
    </a>
  );
}
