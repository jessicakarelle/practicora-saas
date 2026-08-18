import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { ContactExperience } from "@/components/marketing/contact-experience";
import { CONTACT_EMAIL } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.contact.metadata_title"),
    description: t(locale, "marketing.contact.metadata_description"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <MarketingPageShell
      locale={locale}
      eyebrow={t(locale, "marketing.contact.contact")}
      title={t(locale, "marketing.contact.let_s_talk_about_your_internship_experience_or_program")}
      description={t(locale, "marketing.contact.the_best_product_decisions_come_from_real_problems_describe_your_context_current")}
    >
      <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ContactExperience locale={locale} contactEmail={CONTACT_EMAIL} />
      </section>
    </MarketingPageShell>
  );
}
