"use client";

import { translate as t } from "@/i18n";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { PlatformRequired } from "@/components/platform/platform-required";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldHint, FieldLabel, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { createOrganization, destinationForRoles, resolveWorkspaceContext, setLastWorkspace } from "@/lib/organization";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export default function NewOrganizationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { refresh } = useWorkspace();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editedSlug, setEditedSlug] = useState(false);
  const [type, setType] = useState("college");
  const [country, setCountry] = useState("CA");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [loading, setLoading] = useState(false);


  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || slug.length < 3) {
      toast.error(t(locale, "organization.new.add_a_valid_name_and_identifier"));
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error(t(locale, "organization.new.supabase_must_be_configured_to_create_an_organization"));
      return;
    }
    setLoading(true);
    const result = await createOrganization({ name: name.trim(), slug, type, country, timezone });
    setLoading(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    await refresh();
    const organizationId = typeof result.data === "string" ? result.data : String((result.data as Record<string, unknown> | null)?.organization_id || result.data || "");
    const nextContext = await resolveWorkspaceContext(locale);
    const workspace = nextContext.workspaces.find((item) => item.kind === "organization" && item.organizationId === organizationId);
    if (workspace?.kind === "organization") {
      await setLastWorkspace(workspace);
      router.push(destinationForRoles(locale, workspace.roleKeys));
    } else {
      router.push(`/${locale}/app/workspaces`);
    }
    toast.success(t(locale, "organization.new.institutional_workspace_created"));
  }

  return (
    <PlatformRequired locale={locale} permission="platform.organizations.create">
    <>
      <PageHeader title={t(locale, "organization.new.create_institutional_workspace")} description={t(locale, "organization.new.the_creator_becomes_the_verified_owner_other_roles_are_assigned_by_invitation_ne")} />
      <div className="mx-auto max-w-3xl">
        <Card><CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4 rounded-2xl border border-primary/15 bg-primary-softer/60 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary"><Sparkles className="size-5" /></span><div><h2 className="font-extrabold">{t(locale, "organization.new.automatic_role_resolution")}</h2><p className="mt-1 text-sm leading-6 text-muted-strong">{t(locale, "organization.new.at_every_sign_in_practicora_checks_memberships_roles_permissions_and_assignments")}</p></div></div>
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <div><FieldLabel>{t(locale, "organization.new.institution_name")}</FieldLabel><div className="relative"><Building2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!editedSlug) setSlug(slugify(value)); }} className="pl-10" placeholder={t(locale, "organization.new.college_university_or_organization")} /></div></div>
            <div><FieldLabel>{t(locale, "organization.new.workspace_identifier")}</FieldLabel><div className="relative"><Globe2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" /><Input value={slug} onChange={(event) => { setEditedSlug(true); setSlug(slugify(event.target.value)); }} className="pl-10" placeholder={t(locale, "organization.new.workspace_identifier_placeholder")} /></div><FieldHint>{t(locale, "organization.new.used_in_links_and_invitations_lowercase_letters_numbers_and_hyphens")}</FieldHint></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><FieldLabel>{t(locale, "organization.new.organization_type")}</FieldLabel><Select value={type} onValueChange={setType} options={[{ value: "college", label: t(locale, "organization.new.college") }, { value: "university", label: t(locale, "organization.new.university") }, { value: "school", label: t(locale, "organization.new.school") }, { value: "company", label: t(locale, "organization.new.company") }, { value: "association", label: t(locale, "organization.new.association") }]} /></div>
              <div><FieldLabel>{t(locale, "organization.new.country")}</FieldLabel><Select value={country} onValueChange={setCountry} options={[{ value: "CA", label: t(locale, "organization.new.canada") }, { value: "US", label: t(locale, "organization.new.united_states") }, { value: "FR", label: t(locale, "organization.new.france") }, { value: "BE", label: t(locale, "organization.new.belgium") }, { value: "CH", label: t(locale, "organization.new.switzerland") }, { value: "OTHER", label: t(locale, "organization.new.other") }]} /></div>
            </div>
            <div><FieldLabel>{t(locale, "organization.new.timezone")}</FieldLabel><Select value={timezone} onValueChange={setTimezone} startIcon={<MapPin className="size-4" />} options={[{ value: "America/Toronto", label: t(locale, "common.misc.timezone_america_toronto") }, { value: "America/Montreal", label: t(locale, "common.misc.timezone_america_montreal") }, { value: "America/Vancouver", label: t(locale, "common.misc.timezone_america_vancouver") }, { value: "America/New_York", label: t(locale, "common.misc.timezone_america_new_york") }, { value: "Europe/Paris", label: t(locale, "common.misc.timezone_europe_paris") }, { value: "UTC", label: "UTC" }]} /></div>
            <Button type="submit" size="lg" className="w-full justify-center" disabled={loading}>{loading ? (t(locale, "organization.new.creating")) : (t(locale, "organization.new.create_secure_workspace"))}</Button>
          </form>
        </CardContent></Card>
      </div>
    </>
    </PlatformRequired>
  );
}
