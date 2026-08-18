import { translate as t } from "@/i18n";
import type { Metadata } from "next";
import {
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  Layers3,
  MailCheck,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t(locale, "marketing.institutions.practicora_for_institutions"),
    description: t(locale, "marketing.institutions.manage_cohorts_roles_placements_reports_approvals_and_progress_indicators_in_a_s"),
  };
}

export default async function InstitutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const capabilities = [
    [UsersRound, t(locale, "marketing.institutions.cohorts_and_programs"), t(locale, "marketing.institutions.structure_students_by_program_term_cohort_and_academic_owner")],
    [KeyRound, t(locale, "marketing.institutions.automatically_resolved_roles"), t(locale, "marketing.institutions.at_sign_in_practicora_loads_verified_memberships_roles_permissions_and_assignmen")],
    [GraduationCap, t(locale, "marketing.institutions.role_aware_workspaces"), t(locale, "marketing.institutions.students_teachers_program_managers_supervisors_and_administrators_only_see_autho")],
    [Layers3, t(locale, "marketing.institutions.structured_templates"), t(locale, "marketing.institutions.create_report_templates_cadences_required_sections_and_criteria_for_each_program")],
    [ClipboardCheck, t(locale, "marketing.institutions.review_and_approval"), t(locale, "marketing.institutions.centralize_submitted_reports_comments_change_requests_approvals_and_status_histo")],
    [BarChart3, t(locale, "marketing.institutions.institution_analytics"), t(locale, "marketing.institutions.track_hours_completion_pending_reports_and_placements_that_need_attention")],
    [MailCheck, t(locale, "marketing.institutions.secure_invitations"), t(locale, "marketing.institutions.assign_role_and_scope_before_sign_up_then_send_a_personal_expiring_link")],
    [FileSpreadsheet, t(locale, "marketing.institutions.administrative_exports"), t(locale, "marketing.institutions.prepare_usable_data_for_program_owners_audits_and_internal_follow_up")],
    [Archive, t(locale, "marketing.institutions.retention_and_audit"), t(locale, "marketing.institutions.define_retention_periods_and_retain_a_record_of_sensitive_organization_actions")],
  ] as const;

  const workflow = [
    t(locale, "marketing.institutions.create_the_institution_workspace_and_configure_its_rules"),
    t(locale, "marketing.institutions.create_programs_cohorts_and_report_templates"),
    t(locale, "marketing.institutions.invite_members_with_their_exact_role_and_scope"),
    t(locale, "marketing.institutions.assign_each_student_to_a_placement_teacher_and_supervisor"),
    t(locale, "marketing.institutions.receive_reports_review_request_changes_and_approve"),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Practicora Institutional",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: t(locale, "marketing.institutions.platform_for_institutional_internship_cohort_report_and_approval_management"),
    audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
  };

  return (
    <MarketingPageShell
      locale={locale}
      eyebrow={t(locale, "marketing.institutions.practicora_institutional")}
      title={t(locale, "marketing.institutions.an_institutional_workspace_that_automatically_resolves_every_role")}
      description={t(locale, "marketing.institutions.practicora_connects_cohorts_placements_reports_and_approvals_in_a_multi_organiza")}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map(([Icon, title, text]) => (
            <Card key={title} className="h-full">
              <CardContent className="flex h-full gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><Icon className="size-5" /></span>
                <div><h2 className="font-extrabold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-strong">{text}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-muted/50">
        <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3 text-primary"><Network className="size-5" /><span className="text-sm font-extrabold uppercase tracking-[0.13em]">{t(locale, "marketing.institutions.institution_workflow")}</span></div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.035em]">{t(locale, "marketing.institutions.from_invitation_to_approved_report_in_one_system")}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-strong">{t(locale, "marketing.institutions.the_institutional_core_is_designed_for_progressive_rollout_the_institution_contr")}</p>
            <div className="mt-7 flex flex-wrap gap-3"><ButtonLink href={`/${locale}/login`} size="lg"><ShieldCheck className="size-4" />{t(locale, "marketing.institutions.sign_in")}</ButtonLink><ButtonLink href={`/${locale}/contact`} size="lg" variant="secondary"><Building2 className="size-4" />{t(locale, "marketing.institutions.plan_a_pilot")}</ButtonLink></div>
          </div>
          <Card>
            <CardContent>
              <h3 className="text-lg font-extrabold">{t(locale, "marketing.institutions.workflow")}</h3>
              <ol className="mt-5 space-y-4">
                {workflow.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-muted-strong"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-softer text-xs font-extrabold text-primary">{index + 1}</span><span>{step}</span></li>)}
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-[980px] px-4 py-16 text-center sm:px-6 lg:px-8">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success"><ShieldCheck className="size-5" /></span>
        <h2 className="mt-5 text-2xl font-extrabold">{t(locale, "marketing.institutions.a_secure_foundation_configured_around_the_institution_s_real_rules")}</h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-muted-strong">{t(locale, "marketing.institutions.the_multi_organization_schema_rls_policies_roles_invitations_cohorts_placements_")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href={`/${locale}/contact`}>{t(locale, "marketing.institutions.contact_us")}</ButtonLink><ButtonLink href={`/${locale}/features`} variant="secondary"><CheckCircle2 className="size-4" />{t(locale, "marketing.institutions.see_all_features")}</ButtonLink></div>
      </section>
    </MarketingPageShell>
  );
}
