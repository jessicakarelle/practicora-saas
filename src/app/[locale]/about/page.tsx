import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { BookOpenCheck, Gauge, ShieldCheck, Smartphone, Sparkles, UsersRound } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.about.metadata_title"),
    description: t(locale, "marketing.about.metadata_description"),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const principles = [
    [BookOpenCheck, t(locale, "marketing.about.document_to_learn"), t(locale, "marketing.about.every_entry_should_explain_work_decisions_and_growth_not_only_confirm_attendance")],
    [ShieldCheck, t(locale, "marketing.about.data_under_control"), t(locale, "marketing.about.local_mode_works_without_an_account_exports_stay_available_and_cloud_sync_remain")],
    [Smartphone, t(locale, "marketing.about.responsive_from_the_start"), t(locale, "marketing.about.forms_charts_modals_and_filters_are_designed_for_mobile_tablet_and_desktop_inste")],
    [Gauge, t(locale, "marketing.about.measurable_simplicity"), t(locale, "marketing.about.a_feature_should_remove_real_friction_clarify_a_decision_or_make_data_more_relia")],
    [Sparkles, t(locale, "marketing.about.purposeful_motion"), t(locale, "marketing.about.transitions_remain_short_and_subtle_they_communicate_state_changes_without_slowi")],
    [UsersRound, t(locale, "marketing.about.designed_for_multiple_stakeholders"), t(locale, "marketing.about.the_student_remains_central_while_the_structure_also_supports_reports_supervisor")],
  ] as const;

  return (
    <MarketingPageShell
      locale={locale}
      eyebrow={t(locale, "marketing.about.about")}
      title={t(locale, "marketing.about.make_internships_measurable_presentable_and_genuinely_educational")}
      description={t(locale, "marketing.about.practicora_starts_from_a_simple_idea_a_student_should_not_have_to_reconstruct_mo")}
    >
      <section className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose-stage max-w-3xl">
          <h2>{t(locale, "marketing.about.why_practicora_exists")}</h2>
          <p>{t(locale, "marketing.about.internship_information_is_often_scattered_across_timesheets_school_documents_per")}</p>
          <p>{t(locale, "marketing.about.practicora_brings_these_elements_into_a_calm_structured_workspace_the_goal_is_no")}</p>
          <h2>{t(locale, "marketing.about.a_product_foundation_not_an_exaggerated_promise")}</h2>
          <p>{t(locale, "marketing.about.the_current_version_is_a_functional_saas_foundation_indexable_public_site_privat")}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {principles.map(([Icon, title, text]) => <Card key={title}><CardContent><span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></span><h2 className="mt-5 text-lg font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-strong">{text}</p></CardContent></Card>)}
        </div>

        <div className="prose-stage mt-14 max-w-3xl">
          <h2>{t(locale, "marketing.about.who_the_platform_is_for")}</h2>
          <p>{t(locale, "marketing.about.practicora_is_first_designed_for_students_and_interns_who_want_reliable_data_cle")}</p>
          <h2>{t(locale, "marketing.about.the_practicora_name")}</h2>
          <p>{t(locale, "marketing.about.practicora_is_the_working_name_used_for_this_new_version_before_public_commercia")}</p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
