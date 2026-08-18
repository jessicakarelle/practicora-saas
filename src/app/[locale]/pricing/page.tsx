import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import { Check, CircleHelp } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.pricing.metadata_title"),
    description: t(locale, "marketing.pricing.metadata_description"),
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const plans = [
    {
      name: t(locale, "marketing.pricing.local"),
      price: t(locale, "marketing.pricing.free_price"),
      cadence: t(locale, "marketing.pricing.no_time_limit"),
      text: t(locale, "marketing.pricing.document_an_internship_on_one_device_without_creating_a_paid_subscription"),
      features: [1, 2, 3, 4, 5].map((index) => t(locale, `marketing.pricing.local_feature_${index}`)),
      action: t(locale, "marketing.pricing.start_free"),
    },
    {
      name: t(locale, "marketing.pricing.individual_cloud"),
      price: t(locale, "marketing.pricing.beta"),
      cadence: t(locale, "marketing.pricing.pricing_to_be_confirmed"),
      featured: true,
      text: t(locale, "marketing.pricing.sync_a_verified_account_and_access_data_across_devices"),
      features: [1, 2, 3, 4, 5].map((index) => t(locale, `marketing.pricing.cloud_feature_${index}`)),
      action: t(locale, "marketing.pricing.try_the_current_foundation"),
    },
    {
      name: t(locale, "marketing.pricing.institution"),
      price: t(locale, "marketing.pricing.custom"),
      cadence: t(locale, "marketing.pricing.pilot_program"),
      text: t(locale, "marketing.pricing.a_future_offer_for_programs_that_need_cohorts_templates_and_supervised_validatio"),
      features: [1, 2, 3, 4, 5].map((index) => t(locale, `marketing.pricing.institution_feature_${index}`)),
      action: t(locale, "marketing.pricing.explore_the_institution_offer"),
    },
  ];

  const faq = [
    [t(locale, "marketing.pricing.does_the_local_plan_send_my_data_online"), t(locale, "marketing.pricing.no_without_supabase_configuration_data_is_stored_in_the_browser_and_remains_expo")],
    [t(locale, "marketing.pricing.are_paid_plans_already_commercially_available"), t(locale, "marketing.pricing.no_this_delivery_is_a_product_foundation_cloud_and_institution_pricing_must_be_v")],
    [t(locale, "marketing.pricing.can_i_switch_plans_without_losing_data"), t(locale, "marketing.pricing.json_export_keeps_a_complete_copy_cloud_sync_is_designed_to_use_the_same_structu")],
    [t(locale, "marketing.pricing.does_practicora_replace_my_institution_s_rules"), t(locale, "marketing.pricing.no_hours_report_formats_approvals_and_confidentiality_must_always_follow_your_pr")],
  ];

  return (
    <MarketingPageShell
      locale={locale}
      eyebrow={t(locale, "marketing.pricing.pricing")}
      title={t(locale, "marketing.pricing.start_free_then_validate_cloud_value_before_commercialization")}
      description={t(locale, "marketing.pricing.local_mode_is_immediately_usable_cloud_and_institution_plans_are_presented_as_a_")}
    >
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.featured ? "border-primary shadow-lg" : ""}>
              <CardContent className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{plan.name}</h2>{plan.featured ? <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">{t(locale, "marketing.pricing.roadmap")}</span> : null}</div>
                <div className="mt-6 text-3xl font-extrabold tracking-[-0.04em]">{plan.price}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{plan.cadence}</div>
                <p className="mt-4 min-h-18 text-sm leading-6 text-muted-strong">{plan.text}</p>
                <ul className="mt-6 flex-1 space-y-3">{plan.features.map((item) => <li key={item} className="flex items-start gap-2 text-sm font-medium leading-5"><Check className="mt-0.5 size-4 shrink-0 text-success" />{item}</li>)}</ul>
                <ButtonLink href={plan.name === (t(locale, "marketing.pricing.institution")) ? `/${locale}/institutions` : `/${locale}/register`} variant={plan.featured ? "primary" : "secondary"} className="mt-7 w-full">{plan.action}</ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex items-center gap-3"><CircleHelp className="size-5 text-primary" /><h2 className="text-2xl font-extrabold tracking-[-0.03em]">{t(locale, "marketing.pricing.questions_about_access_and_data")}</h2></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">{faq.map(([question, answer]) => <div key={question} className="rounded-2xl border border-border bg-surface p-5"><h3 className="font-extrabold">{question}</h3><p className="mt-2 text-sm leading-6 text-muted-strong">{answer}</p></div>)}</div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
