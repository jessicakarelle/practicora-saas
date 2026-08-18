import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { isLocale } from "@/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.home.professional_internship_journal"),
    description: t(locale, "marketing.home.practicora_centralizes_internship_hours_learning_goals_skills_evaluations_and_re"),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const faqItems = [
    {
      question: t(locale, "marketing.home.does_practicora_work_without_an_account"),
      answer: t(locale, "marketing.home.yes_local_mode_automatically_stores_data_in_the_browser_a_supabase_account_is_us"),
    },
    {
      question: t(locale, "marketing.home.can_i_import_my_previous_journal"),
      answer: t(locale, "marketing.home.yes_json_import_normalizes_older_stagelog_pro_structures_and_converts_them_to_th"),
    },
    {
      question: t(locale, "marketing.home.is_it_suitable_for_mobile"),
      answer: t(locale, "marketing.home.yes_navigation_forms_filters_charts_calendars_and_modals_are_designed_for_mobile"),
    },
    {
      question: t(locale, "marketing.home.does_practicora_replace_an_official_timesheet"),
      answer: t(locale, "marketing.home.no_practicora_helps_maintain_a_reliable_history_but_your_institution_and_employe"),
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Practicora",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: `${base}/${locale}`,
        description: t(locale, "marketing.home.hero_subtitle"),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CAD",
          category: t(locale, "marketing.home.free_local_plan"),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  const features = [
    { icon: TimerReset, title: t(locale, "marketing.home.accurate_hours"), text: t(locale, "marketing.home.calculate_hours_and_breaks_automatically_without_fragile_spreadsheets") },
    { icon: BookOpenCheck, title: t(locale, "marketing.home.structured_journal"), text: t(locale, "marketing.home.document_work_learning_challenges_tasks_and_evidence") },
    { icon: Target, title: t(locale, "marketing.home.measurable_goals"), text: t(locale, "marketing.home.connect_daily_work_to_goals_and_see_real_progress") },
    { icon: BarChart3, title: t(locale, "marketing.home.useful_analytics"), text: t(locale, "marketing.home.understand_pace_skills_and_consistency_without_decorative_charts") },
    { icon: FileText, title: t(locale, "marketing.home.professional_reports"), text: t(locale, "marketing.home.prepare_clean_reports_from_data_that_is_already_organized") },
    { icon: ShieldCheck, title: t(locale, "marketing.home.local_first_and_cloud"), text: t(locale, "marketing.home.drafts_remain_available_locally_and_can_sync_with_supabase") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingHeader locale={locale} />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="marketing-grid pointer-events-none absolute inset-0 opacity-65" />
          <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 py-18 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:py-28">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-softer px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="size-3.5" />
                {t(locale, "marketing.home.hero_eyebrow")}
              </div>
              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.25rem] lg:leading-[1.03]">
                {t(locale, "marketing.home.hero_title")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-strong sm:text-lg sm:leading-8">
                {t(locale, "marketing.home.hero_subtitle")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/${locale}/register`} size="lg">
                  {t(locale, "marketing.home.hero_primary")}<ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href={`/${locale}/features`} variant="secondary" size="lg">
                  {t(locale, "marketing.home.hero_secondary")}
                </ButtonLink>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted">
                {[t(locale, "marketing.home.no_card_required"), t(locale, "marketing.home.legacy_data_import"), t(locale, "marketing.home.mobile_ready")].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />{item}</span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="relative mx-auto w-full max-w-[620px]">
                <div className="absolute -inset-8 rounded-[2.5rem] bg-primary-soft/45 blur-3xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-[var(--shadow-float)]">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-success" /><span className="text-sm font-bold">{t(locale, "marketing.home.active_internship")}</span></div>
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">{t(locale, "marketing.home.demo_progress_percent")}</span>
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <Metric label={t(locale, "marketing.home.documented_hours")} value={t(locale, "marketing.home.demo_documented_hours")} meta={t(locale, "marketing.home.of_240_h")} icon={TimerReset} />
                    <Metric label={t(locale, "marketing.home.logged_days")} value="31" meta={t(locale, "marketing.home.text_4_this_week")} icon={CalendarDays} />
                    <div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold">{t(locale, "marketing.home.weekly_progress")}</span><span className="text-sm font-bold text-primary">{t(locale, "marketing.home.demo_weekly_hours")}</span></div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-strong"><div className="h-full w-4/5 rounded-full bg-primary" /></div>
                      <div className="mt-5 grid grid-cols-5 gap-2">
                        {[6.5, 7, 7.5, 7, 0].map((hours, index) => <div key={index} className="flex flex-col items-center gap-2"><div className="flex h-24 w-full items-end rounded-xl bg-surface-muted p-1"><div className="w-full rounded-lg bg-primary/80" style={{ height: `${Math.max(8, hours * 11)}%` }} /></div><span className="text-[11px] font-semibold text-muted">{[t(locale, "marketing.home.weekday_short_monday"), t(locale, "marketing.home.weekday_short_tuesday"), t(locale, "marketing.home.weekday_short_wednesday"), t(locale, "marketing.home.weekday_short_thursday"), t(locale, "marketing.home.weekday_short_friday")][index]}</span></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{t(locale, "marketing.home.a_complete_system")}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{t(locale, "marketing.home.everything_that_matters_without_turning_your_journal_into_an_endless_form")}</h2>
            <p className="mt-4 text-base leading-7 text-muted-strong">{t(locale, "marketing.home.practicora_organizes_information_into_clear_pages_with_a_consistent_hierarchy_on")}</p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.035}>
                <Card className="h-full transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-md">
                  <CardContent>
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><feature.icon className="size-5" /></div>
                    <h3 className="mt-5 text-lg font-bold tracking-[-0.02em]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted/55">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <Reveal>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white"><GraduationCap className="size-6" /></div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{t(locale, "marketing.home.designed_to_produce_a_real_academic_and_professional_outcome")}</h2>
              <p className="mt-4 text-base leading-7 text-muted-strong">{t(locale, "marketing.home.your_journal_should_not_only_prove_attendance_it_should_show_your_reasoning_prog")}</p>
              <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong" href={`/${locale}/blog/comment-rediger-un-journal-de-stage-professionnel`}>{t(locale, "marketing.home.read_the_methodology_guide")}<ArrowRight className="size-4" /></Link>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[t(locale, "marketing.home.reports_prepared_faster"), t(locale, "marketing.home.demonstrable_skills"), t(locale, "marketing.home.visible_progress"), t(locale, "marketing.home.reliable_history")].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 font-semibold shadow-sm"><CheckCircle2 className="size-5 text-success" />{item}</div>)}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-20 sm:px-6 lg:py-24">
          <Reveal className="max-w-3xl">
            <div className="flex items-center gap-3 text-primary"><CircleHelp className="size-5" /><p className="text-sm font-bold uppercase tracking-[0.14em]">{t(locale, "marketing.home.frequently_asked_questions")}</p></div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{t(locale, "marketing.home.understand_exactly_what_the_platform_does_and_what_it_does_not_replace")}</h2>
          </Reveal>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Reveal key={item.question}>
                <div className="h-full rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <h3 className="font-extrabold tracking-[-0.015em]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-strong">{item.answer}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1100px] px-4 py-20 text-center sm:px-6 lg:py-28">
          <Reveal>
            <div className="rounded-[2rem] border border-primary/20 bg-primary-softer px-6 py-12 sm:px-12 sm:py-16">
              <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">{t(locale, "marketing.home.start_with_your_current_internship")}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-strong">{t(locale, "marketing.home.import_existing_data_or_create_a_new_journal_your_workspace_remains_usable_local")}</p>
              <div className="mt-7 flex justify-center"><ButtonLink href={`/${locale}/register`} size="lg">{t(locale, "marketing.header.start")}<ArrowRight className="size-4" /></ButtonLink></div>
            </div>
          </Reveal>
        </section>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}

function Metric({ label, value, meta, icon: Icon }: { label: string; value: string; meta: string; icon: typeof TimerReset }) {
  return <div className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">{label}</span><Icon className="size-4 text-primary" /></div><div className="mt-4 text-3xl font-extrabold tracking-[-0.04em]">{value}</div><div className="mt-1 text-sm text-muted">{meta}</div></div>;
}
