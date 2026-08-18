import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Cloud,
  FileText,
  Filter,
  Goal,
  History,
  Languages,
  ListChecks,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  WandSparkles,
} from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.features.metadata_title"),
    description: t(locale, "marketing.features.metadata_description"),
  };
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const items = [
    [TimerReset, t(locale, "marketing.features.automatically_calculated_hours"), t(locale, "marketing.features.enter_start_end_and_break_times_practicora_calculates_totals_weekly_progress_and")],
    [BookOpenCheck, t(locale, "marketing.features.complete_daily_journal"), t(locale, "marketing.features.document_context_project_completed_work_outcomes_learning_blockers_feedback_next")],
    [ListChecks, t(locale, "marketing.features.tasks_and_priorities"), t(locale, "marketing.features.add_multiple_tasks_per_day_assign_priorities_and_categories_then_track_completio")],
    [CalendarDays, t(locale, "marketing.features.calendar_and_week"), t(locale, "marketing.features.see_documented_days_missing_periods_and_your_current_pace_without_scanning_a_lon")],
    [History, t(locale, "marketing.features.filterable_history"), t(locale, "marketing.features.search_by_text_date_category_work_mode_mood_or_sort_order_to_find_precise_inform")],
    [Target, t(locale, "marketing.features.measurable_goals"), t(locale, "marketing.features.define_category_priority_success_metric_and_progress_then_update_the_goal_throug")],
    [Goal, t(locale, "marketing.features.demonstrable_skills"), t(locale, "marketing.features.group_skills_and_technologies_actually_used_counts_come_from_logged_days_not_a_d")],
    [BarChart3, t(locale, "marketing.features.multi_angle_analytics"), t(locale, "marketing.features.analyze_daily_and_cumulative_hours_work_categories_work_modes_weekdays_mood_ener")],
    [FileText, t(locale, "marketing.features.reports_and_exports"), t(locale, "marketing.features.produce_a_professional_summary_print_to_pdf_and_export_json_or_csv_for_backup_or")],
    [Cloud, t(locale, "marketing.features.local_and_cloud_backup"), t(locale, "marketing.features.every_change_is_saved_automatically_in_the_browser_when_supabase_is_configured_t")],
    [MailCheck, t(locale, "marketing.features.email_verification"), t(locale, "marketing.features.cloud_accounts_include_confirmation_verification_email_resend_and_password_recov")],
    [LockKeyhole, t(locale, "marketing.features.pin_protected_pages"), t(locale, "marketing.features.hide_analytics_compensation_reports_or_settings_behind_a_local_pin_with_inactivi")],
    [Languages, t(locale, "marketing.features.continuous_french_and_english"), t(locale, "marketing.features.switch_languages_without_returning_home_the_route_page_and_search_parameters_are")],
    [Filter, t(locale, "marketing.features.professional_filters"), t(locale, "marketing.features.data_heavy_pages_provide_search_periods_categories_states_and_sorting_so_the_app")],
    [WandSparkles, t(locale, "marketing.features.custom_controls"), t(locale, "marketing.features.selects_calendars_time_controls_switches_and_compact_modals_share_one_visual_sys")],
    [ShieldCheck, t(locale, "marketing.features.data_isolation"), t(locale, "marketing.features.the_included_supabase_schema_enables_row_level_security_so_an_authenticated_acco")],
  ] as const;

  const workflow = [
    {
      title: t(locale, "marketing.features.text_1_capture_without_friction"),
      text: t(locale, "marketing.features.start_an_entry_complete_it_throughout_the_day_and_let_autosave_preserve_every_ch"),
    },
    {
      title: t(locale, "marketing.features.text_2_organize_evidence"),
      text: t(locale, "marketing.features.connect_projects_categories_tasks_skills_goals_and_evidence_links_to_turn_notes_"),
    },
    {
      title: t(locale, "marketing.features.text_3_understand_progress"),
      text: t(locale, "marketing.features.use_filters_and_charts_to_spot_trends_incomplete_periods_and_skills_actually_use"),
    },
    {
      title: t(locale, "marketing.features.text_4_present_a_credible_outcome"),
      text: t(locale, "marketing.features.prepare_a_report_supervisor_review_or_portfolio_case_study_from_data_that_is_alr"),
    },
  ];

  return (
    <MarketingPageShell
      locale={locale}
      eyebrow={t(locale, "marketing.features.features")}
      title={t(locale, "marketing.features.a_complete_workspace_to_document_understand_and_present_your_internship")}
      description={t(locale, "marketing.features.practicora_replaces_scattered_notes_spreadsheets_and_last_minute_reports_with_a_")}
    >
      <section className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(([Icon, title, text]) => (
            <Card key={title} className="h-full transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-md">
              <CardContent className="flex h-full gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></div>
                <div><h2 className="text-base font-extrabold tracking-[-0.02em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-strong">{text}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted/55">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">{t(locale, "marketing.features.a_coherent_workflow")}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em]">{t(locale, "marketing.features.from_the_workday_to_the_final_report_without_re_entering_the_same_information")}</h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {workflow.map((step) => <div key={step.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm"><h3 className="font-extrabold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-strong">{step.text}</p></div>)}
          </div>
          <div className="mt-9"><ButtonLink href={`/${locale}/register`} size="lg"><Sparkles className="size-4" />{t(locale, "marketing.features.create_my_workspace")}</ButtonLink></div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
