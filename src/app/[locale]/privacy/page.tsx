import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { CONTACT_EMAIL } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.privacy.metadata_title"),
    description: t(locale, "marketing.privacy.metadata_description"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <MarketingPageShell locale={locale} eyebrow={t(locale, "marketing.privacy.privacy")} title={t(locale, "marketing.privacy.your_internship_data_should_remain_under_your_control")} description={t(locale, "marketing.privacy.this_policy_describes_the_current_practicora_foundation_it_must_be_adapted_to_th")}>
      <article className="prose-stage mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p><strong>{t(locale, "marketing.privacy.last_updated_july_16_2026")}</strong></p>
        <h2>{t(locale, "marketing.privacy.text_1_data_stored_in_the_browser")}</h2>
        <p>{t(locale, "marketing.privacy.in_local_mode_internships_entries_goals_notes_settings_evaluations_and_compensat")}</p>
        <p>{t(locale, "marketing.privacy.clearing_browser_data_using_another_profile_or_resetting_the_device_may_make_thi")}</p>
        <h2>{t(locale, "marketing.privacy.text_2_accounts_and_supabase_synchronization")}</h2>
        <p>{t(locale, "marketing.privacy.when_supabase_variables_are_configured_and_a_user_creates_an_account_supabase_pr")}</p>
        <h2>{t(locale, "marketing.privacy.text_3_potentially_sensitive_data")}</h2>
        <p>{t(locale, "marketing.privacy.an_internship_journal_may_contain_names_internal_projects_compensation_feedback_")}</p>
        <h2>{t(locale, "marketing.privacy.text_4_authentication_emails")}</h2>
        <p>{t(locale, "marketing.privacy.supabase_may_send_confirmation_password_recovery_and_security_emails_when_these_")}</p>
        <h2>{t(locale, "marketing.privacy.text_5_export_deletion_and_portability")}</h2>
        <p>{t(locale, "marketing.privacy.the_app_supports_structured_data_export_local_reset_clears_the_browser_workspace")}</p>
        <h2>{t(locale, "marketing.privacy.text_6_analytics_and_cookies")}</h2>
        <p>{t(locale, "marketing.privacy.the_delivered_foundation_does_not_integrate_advertising_or_third_party_behaviora")}</p>
        <h2>{t(locale, "marketing.privacy.text_7_contact")}</h2>
        <p>{t(locale, "marketing.privacy.contact_privacy", { email: CONTACT_EMAIL })}</p>
      </article>
    </MarketingPageShell>
  );
}
