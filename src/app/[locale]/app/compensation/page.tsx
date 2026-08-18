"use client";

import { localeTag, translate as t } from "@/i18n";

import { use, useMemo } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { enCA, frCA } from "date-fns/locale";
import {
  Banknote,
  Calculator,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/page-header";
import { MetricCard } from "@/components/app/metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useStageLog } from "@/lib/store";
import { formatHours } from "@/lib/utils";

const PIE_COLORS = ["#2f7d5b", "#b74652"];

export default function CompensationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const fr = locale !== "en";
  const dateLocale = fr ? frCA : enCA;
  const { data, activeEntries, updateSalary, syncStatus } = useStageLog();
  const salary = data.salary;

  const result = useMemo(() => {
    const entries = activeEntries.filter((entry) => {
      if (salary.from && entry.date < salary.from) return false;
      if (salary.to && entry.date > salary.to) return false;
      return true;
    });

    const hours = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const days = new Set(entries.map((entry) => entry.date)).size;
    const baseGross = salary.type === "daily" ? days * salary.dailyRate : hours * salary.rate;
    const vacationPay = baseGross * clampPercent(salary.vacationPayPercent) / 100;
    const gross = baseGross + vacationPay;
    const incomeTax = gross * clampPercent(salary.incomeTaxPercent) / 100;
    const pension = gross * clampPercent(salary.pensionPercent) / 100;
    const employmentInsurance = gross * clampPercent(salary.employmentInsurancePercent) / 100;
    const otherDeductions = gross * clampPercent(salary.otherDeductionPercent) / 100;
    const deductions = incomeTax + pension + employmentInsurance + otherDeductions;
    const net = Math.max(0, gross - deductions);

    return {
      entries,
      hours,
      days,
      baseGross,
      vacationPay,
      gross,
      incomeTax,
      pension,
      employmentInsurance,
      otherDeductions,
      deductions,
      net,
      effectiveRate: gross > 0 ? deductions / gross * 100 : 0,
      netHourly: hours > 0 ? net / hours : 0,
      netDaily: days > 0 ? net / days : 0,
    };
  }, [activeEntries, salary]);

  const formatter = useMemo(
    () => new Intl.NumberFormat(localeTag(locale), {
      style: "currency",
      currency: data.settings.currency,
      maximumFractionDigits: 2,
    }),
    [data.settings.currency, locale],
  );

  const weeklyData = useMemo(() => {
    const groups = new Map<string, typeof result.entries>();
    for (const entry of result.entries) {
      const week = format(startOfWeek(parseISO(`${entry.date}T12:00:00`), { weekStartsOn: 1 }), "yyyy-MM-dd");
      groups.set(week, [...(groups.get(week) ?? []), entry]);
    }

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([week, entries]) => {
        const hours = entries.reduce((sum, entry) => sum + entry.hours, 0);
        const days = new Set(entries.map((entry) => entry.date)).size;
        const baseGross = salary.type === "daily" ? days * salary.dailyRate : hours * salary.rate;
        const gross = baseGross * (1 + clampPercent(salary.vacationPayPercent) / 100);
        const deductionRate = (
          clampPercent(salary.incomeTaxPercent) +
          clampPercent(salary.pensionPercent) +
          clampPercent(salary.employmentInsurancePercent) +
          clampPercent(salary.otherDeductionPercent)
        ) / 100;
        return {
          week: format(parseISO(`${week}T12:00:00`), t(locale, "app.compensation.mmm_d"), { locale: dateLocale }),
          gross,
          net: Math.max(0, gross * (1 - deductionRate)),
        };
      });
  }, [dateLocale, locale, result, salary]);

  const breakdownData = [
    { name: t(locale, "app.compensation.estimated_net"), value: result.net },
    { name: t(locale, "app.compensation.deductions"), value: result.deductions },
  ];

  const chartCurrency = (value: number | string | undefined) => formatter.format(Number(value ?? 0));

  return (
    <>
      <PageHeader
        title={t(locale, "app.compensation.compensation")}
        description={t(locale, "app.compensation.estimate_gross_pay_deductions_and_net_pay_from_your_actual_logged_days")}
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/15 bg-success/7 px-4 py-3 text-sm text-muted-strong">
        <ShieldCheck className="size-4 shrink-0 text-success" />
        <span>{t(locale, "app.compensation.all_settings_are_saved_automatically_after_every_change")}</span>
        <span className="ml-auto rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-success">{syncStatus}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CalendarRange} label={t(locale, "app.compensation.included_days")} value={String(result.days)} meta={`${formatHours(result.hours)} ${t(locale, "app.compensation.logged")}`} />
        <MetricCard icon={Banknote} label={t(locale, "app.compensation.estimated_gross")} value={formatter.format(result.gross)} meta={salary.type === "hourly" ? `${formatter.format(salary.rate)}/h` : t(locale, "app.compensation.daily_rate_meta", { amount: formatter.format(salary.dailyRate) })} tone="info" />
        <MetricCard icon={ReceiptText} label={t(locale, "app.compensation.estimated_deductions")} value={formatter.format(result.deductions)} meta={`${result.effectiveRate.toFixed(1)} % ${t(locale, "app.compensation.of_gross")}`} tone="warning" />
        <MetricCard icon={Calculator} label={t(locale, "app.compensation.estimated_net")} value={formatter.format(result.net)} meta={t(locale, "app.compensation.for_guidance_only")} tone="success" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-bold">{t(locale, "app.compensation.calculation_settings")}</h2>
              <p className="mt-1 text-sm text-muted">{t(locale, "app.compensation.customize_percentages_based_on_your_situation_and_pay_statement")}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label={t(locale, "app.compensation.compensation_type")}>
              <Select value={salary.type} onValueChange={(value) => updateSalary({ type: value as "hourly" | "daily" })} options={[{ value: "hourly", label: t(locale, "app.compensation.hourly_rate") }, { value: "daily", label: t(locale, "app.compensation.daily_rate") }]} />
            </Field>
            {salary.type === "hourly" ? (
              <Field label={t(locale, "app.compensation.hourly_rate")}><Input type="number" min={0} step="0.01" value={salary.rate} onChange={(event) => updateSalary({ rate: safeNumber(event.target.value) })} /></Field>
            ) : (
              <Field label={t(locale, "app.compensation.daily_rate")}><Input type="number" min={0} step="0.01" value={salary.dailyRate} onChange={(event) => updateSalary({ dailyRate: safeNumber(event.target.value) })} /></Field>
            )}

            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><CircleDollarSign className="size-5" /></span>
                <div>
                  <h3 className="text-sm font-extrabold">{t(locale, "app.compensation.estimated_deductions_and_additions")}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">{t(locale, "app.compensation.rates_are_fully_editable_practicora_does_not_replace_an_official_tax_calculation")}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <PercentField label={t(locale, "app.compensation.income_tax")} value={salary.incomeTaxPercent} onChange={(value) => updateSalary({ incomeTaxPercent: value })} />
                <PercentField label={t(locale, "app.compensation.retirement_pension")} value={salary.pensionPercent} onChange={(value) => updateSalary({ pensionPercent: value })} />
                <PercentField label={t(locale, "app.compensation.employment_insurance")} value={salary.employmentInsurancePercent} onChange={(value) => updateSalary({ employmentInsurancePercent: value })} />
                <PercentField label={t(locale, "app.compensation.other_deductions")} value={salary.otherDeductionPercent} onChange={(value) => updateSalary({ otherDeductionPercent: value })} />
                <PercentField label={t(locale, "app.compensation.vacation_pay_added")} value={salary.vacationPayPercent} onChange={(value) => updateSalary({ vacationPayPercent: value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(locale, "app.compensation.from")}><DatePicker value={salary.from} onChange={(value) => updateSalary({ from: value })} locale={locale} /></Field>
              <Field label={t(locale, "app.compensation.to")}><DatePicker value={salary.to} onChange={(value) => updateSalary({ to: value })} locale={locale} min={salary.from || undefined} /></Field>
            </div>
            <FieldHint>{t(locale, "app.compensation.leave_dates_empty_to_include_every_entry_from_the_active_internship")}</FieldHint>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold"><ChartNoAxesCombined className="size-5 text-primary" />{t(locale, "app.compensation.pay_breakdown")}</h2>
                <p className="mt-1 text-sm text-muted">{t(locale, "app.compensation.visually_compare_net_pay_with_total_deductions")}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                <div className="h-[250px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={3} stroke="transparent">
                        {breakdownData.map((item, index) => <Cell key={item.name} fill={PIE_COLORS[index]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => chartCurrency(value as number)} contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="divide-y divide-border rounded-xl border border-border bg-background">
                  <Row label={t(locale, "app.compensation.base_pay")} value={formatter.format(result.baseGross)} />
                  <Row label={t(locale, "app.compensation.vacation_pay")} value={`+ ${formatter.format(result.vacationPay)}`} positive={result.vacationPay > 0} />
                  <Row label={t(locale, "app.compensation.total_gross")} value={formatter.format(result.gross)} strong />
                  <Row label={t(locale, "app.compensation.total_deductions")} value={`− ${formatter.format(result.deductions)}`} danger />
                  <Row label={t(locale, "app.compensation.estimated_net")} value={formatter.format(result.net)} success />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold"><TrendingUp className="size-5 text-primary" />{t(locale, "app.compensation.weekly_trend")}</h2>
                <p className="mt-1 text-sm text-muted">{t(locale, "app.compensation.estimated_gross_and_net_pay_for_each_week_in_the_selected_period")}</p>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyData.length ? (
                <div className="h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => new Intl.NumberFormat(localeTag(locale), { notation: "compact" }).format(value)} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                      <Tooltip formatter={(value) => chartCurrency(value as number)} contentStyle={{ borderRadius: 14, borderColor: "var(--border)", background: "var(--surface)" }} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                      <Bar dataKey="gross" name={t(locale, "app.compensation.gross")} fill="#2f6f9f" radius={[7, 7, 0, 0]} />
                      <Bar dataKey="net" name={t(locale, "app.compensation.net")} fill="#2f7d5b" radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">{t(locale, "app.compensation.add_entries_or_expand_the_period_to_display_the_chart")}</div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <InsightCard label={t(locale, "app.compensation.average_net_per_hour")} value={formatter.format(result.netHourly)} icon={Banknote} />
        <InsightCard label={t(locale, "app.compensation.average_net_per_day")} value={formatter.format(result.netDaily)} icon={CalendarRange} />
        <InsightCard label={t(locale, "app.compensation.effective_deduction_rate")} value={`${result.effectiveRate.toFixed(1)} %`} icon={ReceiptText} />
        <InsightCard label={t(locale, "app.compensation.included_entries")} value={String(result.entries.length)} icon={Calculator} />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <h2 className="text-lg font-bold">{t(locale, "app.compensation.deduction_details")}</h2>
            <p className="mt-1 text-sm text-muted">{t(locale, "app.compensation.a_transparent_breakdown_of_every_percentage_applied_to_gross_pay")}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DeductionCard label={t(locale, "app.compensation.estimated_tax")} percent={salary.incomeTaxPercent} value={formatter.format(result.incomeTax)} />
            <DeductionCard label={t(locale, "app.compensation.retirement_pension")} percent={salary.pensionPercent} value={formatter.format(result.pension)} />
            <DeductionCard label={t(locale, "app.compensation.employment_insurance")} percent={salary.employmentInsurancePercent} value={formatter.format(result.employmentInsurance)} />
            <DeductionCard label={t(locale, "app.compensation.other_deductions")} percent={salary.otherDeductionPercent} value={formatter.format(result.otherDeductions)} />
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">{t(locale, "app.compensation.these_estimates_are_for_personal_planning_tax_rules_limits_credits_and_exemption")}</p>
        </CardContent>
      </Card>
    </>
  );
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function safeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><FieldLabel>{label}</FieldLabel>{children}</div>;
}

function PercentField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input className="pr-10" type="number" min={0} max={100} step="0.01" value={value} onChange={(event) => onChange(safeNumber(event.target.value))} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-bold text-muted">%</span>
      </div>
    </Field>
  );
}

function Row({ label, value, strong, danger, success, positive }: { label: string; value: string; strong?: boolean; danger?: boolean; success?: boolean; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span className="text-sm text-muted-strong">{label}</span>
      <span className={`text-right font-mono text-sm font-bold tabular-nums ${strong ? "text-base text-foreground" : ""} ${danger ? "text-danger" : ""} ${success ? "text-base text-success" : ""} ${positive ? "text-success" : ""}`}>{value}</span>
    </div>
  );
}

function InsightCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Banknote }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-5" /></span>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</div>
        <div className="mt-1 truncate text-xl font-extrabold text-foreground tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function DeductionCard({ label, percent, value }: { label: string; percent: number; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-2 text-xl font-extrabold text-foreground tabular-nums">{value}</div>
      <div className="mt-1 text-sm font-semibold text-danger">{clampPercent(percent).toFixed(2)} %</div>
    </div>
  );
}
