import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { CONTACT_EMAIL } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.terms.metadata_title"),
    description: t(locale, "marketing.terms.metadata_description"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <MarketingPageShell locale={locale} eyebrow={t(locale, "marketing.terms.terms")} title={t(locale, "marketing.terms.use_practicora_responsibly_and_in_accordance_with_your_workplace")} description={t(locale, "marketing.terms.these_terms_describe_the_current_demonstration_foundation_legal_review_for_the_o")}>
      <article className="prose-stage mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p><strong>{t(locale, "marketing.terms.last_updated_july_16_2026")}</strong></p>
        <h2>{t(locale, "marketing.terms.text_1_purpose_of_the_service")}</h2>
        <p>{t(locale, "marketing.terms.practicora_provides_tools_to_document_internships_calculate_hours_organize_goals")}</p>
        <h2>{t(locale, "marketing.terms.text_2_accuracy_of_information")}</h2>
        <p>{t(locale, "marketing.terms.users_remain_responsible_for_the_accuracy_of_dates_hours_descriptions_and_report")}</p>
        <h2>{t(locale, "marketing.terms.text_3_professional_confidentiality")}</h2>
        <p>{t(locale, "marketing.terms.users_must_follow_the_policies_of_their_institution_and_internship_workplace_pra")}</p>
        <h2>{t(locale, "marketing.terms.text_4_accounts_and_security")}</h2>
        <p>{t(locale, "marketing.terms.when_a_cloud_account_is_enabled_users_must_protect_their_password_verify_their_e")}</p>
        <h2>{t(locale, "marketing.terms.text_5_backups")}</h2>
        <p>{t(locale, "marketing.terms.local_mode_depends_on_browser_storage_users_should_keep_regular_exports_when_dat")}</p>
        <h2>{t(locale, "marketing.terms.text_6_availability_and_evolution")}</h2>
        <p>{t(locale, "marketing.terms.the_foundation_may_evolve_be_interrupted_or_change_functionality_during_developm")}</p>
        <h2>{t(locale, "marketing.terms.text_7_contact")}</h2>
        <p>{t(locale, "marketing.terms.contact_terms", { email: CONTACT_EMAIL })}</p>
      </article>
    </MarketingPageShell>
  );
}
