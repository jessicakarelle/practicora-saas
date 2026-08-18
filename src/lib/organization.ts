import type { Provider } from "@supabase/supabase-js";
import { normalizeLocale, translate as t } from "@/i18n";
import { resolvePlatformContext, type PlatformContext, type PlatformRoleKey } from "@/lib/platform";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { readDemoRole, resolveDemoWorkspaceContext } from "@/lib/demo";

export type OrganizationRoleKey =
  | "owner"
  | "admin"
  | "program_manager"
  | "teacher"
  | "supervisor"
  | "student";

export type WorkspaceKind = "personal" | "organization" | "platform";

export type OrganizationWorkspace = {
  id: string;
  kind: "organization";
  organizationId: string;
  membershipId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  roleKeys: OrganizationRoleKey[];
  permissions: string[];
  status: "active" | "invited" | "suspended";
  lastUsedAt?: string;
};

export type PersonalWorkspace = {
  id: "personal";
  kind: "personal";
  name: string;
  roleKeys: ["student"];
  permissions: string[];
};

export type PlatformWorkspace = {
  id: "platform";
  kind: "platform";
  name: string;
  roleKeys: PlatformRoleKey[];
  permissions: string[];
  status: "active" | "suspended" | "revoked";
};

export type PracticoraWorkspace = PersonalWorkspace | OrganizationWorkspace | PlatformWorkspace;

export type WorkspaceContext = {
  profile: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  workspaces: PracticoraWorkspace[];
  recommendedWorkspaceId: string;
  platform: PlatformContext;
};

export type OrganizationMember = {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  status: string;
  roles: OrganizationRoleKey[];
  joinedAt: string;
};

export type OrganizationProgram = {
  id: string;
  name: string;
  code: string;
  description: string;
  requiredHours: number;
  status: string;
  createdAt: string;
};

export type OrganizationCohort = {
  id: string;
  programId: string;
  programName: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  studentCount: number;
};

export type OrganizationPlacement = {
  id: string;
  studentName: string;
  company: string;
  roleTitle: string;
  teacherName: string;
  supervisorName: string;
  status: string;
  loggedHours: number;
  requiredHours: number;
};

export type OrganizationInvitation = {
  id: string;
  email: string;
  roleKey: OrganizationRoleKey;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type InstitutionalReport = {
  id: string;
  title: string;
  studentName: string;
  reportType: string;
  periodLabel: string;
  status: string;
  submittedAt: string | null;
  updatedAt: string;
};

export type OrganizationDashboard = {
  memberCount: number;
  studentCount: number;
  teacherCount: number;
  activePlacements: number;
  reportsWaiting: number;
  atRiskPlacements: number;
  completionRate: number;
};

export const OAUTH_PROVIDERS: Array<{
  provider: Provider;
  key: "google" | "github" | "azure" | "apple";
}> = [
  { provider: "google", key: "google" },
  { provider: "github", key: "github" },
  { provider: "azure", key: "azure" },
  { provider: "apple", key: "apple" },
];

export function configuredOAuthProviderKeys() {
  return (process.env.NEXT_PUBLIC_AUTH_PROVIDERS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is (typeof OAUTH_PROVIDERS)[number]["key"] =>
      OAUTH_PROVIDERS.some((provider) => provider.key === item),
    );
}

export function enabledOAuthProviders() {
  const configured = configuredOAuthProviderKeys();
  return OAUTH_PROVIDERS.filter((provider) => configured.includes(provider.key));
}

export function roleLabel(role: OrganizationRoleKey, locale: string) {
  return t(locale, `common.organization.role_${role}`);
}

export function platformRoleLabel(role: PlatformRoleKey, locale: string) {
  return t(locale, `platform.roles.${role}`);
}

export function destinationForRoles(locale: string, roles: OrganizationRoleKey[]) {
  const prefix = `/${locale}/app`;
  if (roles.includes("owner") || roles.includes("admin")) return `${prefix}/organization`;
  if (roles.includes("program_manager")) return `${prefix}/program`;
  if (roles.includes("teacher")) return `${prefix}/teaching`;
  if (roles.includes("supervisor")) return `${prefix}/supervision`;
  return prefix;
}

export function destinationForWorkspace(locale: string, workspace: PracticoraWorkspace) {
  if (workspace.kind === "platform") return `/${locale}/app/platform`;
  if (workspace.kind === "organization") return destinationForRoles(locale, workspace.roleKeys);
  return `/${locale}/app`;
}

function personalWorkspace(locale: string): PersonalWorkspace {
  return {
    id: "personal",
    kind: "personal",
    name: t(locale, "common.organization.personal_workspace"),
    roleKeys: ["student"],
    permissions: ["personal.manage"],
  };
}

function normalizeWorkspace(value: unknown, locale: string): OrganizationWorkspace | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const organizationId = String(row.organization_id || row.organizationId || "");
  const membershipId = String(row.membership_id || row.membershipId || "");
  if (!organizationId || !membershipId) return null;
  const rawRoles = Array.isArray(row.roles) ? row.roles : [];
  const validRoles: OrganizationRoleKey[] = rawRoles
    .map(String)
    .filter((role): role is OrganizationRoleKey =>
      ["owner", "admin", "program_manager", "teacher", "supervisor", "student"].includes(role),
    );
  return {
    id: `organization:${organizationId}`,
    kind: "organization",
    organizationId,
    membershipId,
    name: String(row.organization_name || row.name || t(locale, "common.organization.organization_fallback")),
    slug: String(row.organization_slug || row.slug || organizationId),
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    roleKeys: validRoles.length ? validRoles : ["student"],
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [],
    status: row.status === "invited" || row.status === "suspended" ? row.status : "active",
    lastUsedAt: row.last_used_at ? String(row.last_used_at) : undefined,
  };
}

export async function resolveWorkspaceContext(locale: string): Promise<WorkspaceContext> {
  const demoRole = readDemoRole();
  if (demoRole) return resolveDemoWorkspaceContext(locale, demoRole, t(locale, "common.organization.personal_workspace"));

  const personal = personalWorkspace(locale);
  const institutionalEnabled = process.env.NEXT_PUBLIC_ENABLE_INSTITUTIONAL !== "false";
  if (!institutionalEnabled || !isSupabaseConfigured()) {
    return { profile: null, workspaces: [personal], recommendedWorkspaceId: personal.id, platform: await resolvePlatformContext() };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { profile: null, workspaces: [personal], recommendedWorkspaceId: personal.id, platform: await resolvePlatformContext() };
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { profile: null, workspaces: [personal], recommendedWorkspaceId: personal.id, platform: await resolvePlatformContext() };

  const platform = await resolvePlatformContext();

  const { data, error } = await supabase.rpc("resolve_practicora_context");
  if (error) {
    console.warn("PRACTICORA_INSTITUTIONAL_CONTEXT_UNAVAILABLE", error.message);
    const platformWorkspace: PlatformWorkspace | null = platform.status === "active" && platform.roles.length
      ? {
          id: "platform",
          kind: "platform",
          name: t(locale, "common.organization.platform_workspace"),
          roleKeys: platform.roles,
          permissions: platform.permissions,
          status: platform.status,
        }
      : null;
    return {
      profile: {
        id: user.id,
        email: user.email || "",
        fullName: String(user.user_metadata?.full_name || user.user_metadata?.name || ""),
      },
      workspaces: [personal, ...(platformWorkspace ? [platformWorkspace] : [])],
      recommendedWorkspaceId: platformWorkspace?.id || personal.id,
      platform,
    };
  }

  const payload = (data || {}) as Record<string, unknown>;
  const memberships = Array.isArray(payload.memberships) ? payload.memberships : [];
  const organizations = memberships.map((item) => normalizeWorkspace(item, locale)).filter(Boolean) as OrganizationWorkspace[];
  const platformWorkspace: PlatformWorkspace | null = platform.status === "active" && platform.roles.length
    ? {
        id: "platform",
        kind: "platform",
        name: t(locale, "common.organization.platform_workspace"),
        roleKeys: platform.roles,
        permissions: platform.permissions,
        status: platform.status,
      }
    : null;
  const workspaces: PracticoraWorkspace[] = [personal, ...(platformWorkspace ? [platformWorkspace] : []), ...organizations];
  const stored = typeof window !== "undefined" ? localStorage.getItem("practicora:active-workspace") : null;
  const recommended = workspaces.some((workspace) => workspace.id === stored)
    ? stored!
    : platformWorkspace?.id || String(payload.recommended_workspace_id || organizations[0]?.id || personal.id);

  return {
    profile: {
      id: user.id,
      email: user.email || "",
      fullName: String(
        (payload.profile as Record<string, unknown> | undefined)?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "",
      ),
    },
    workspaces,
    recommendedWorkspaceId: recommended,
    platform,
  };
}

export async function setLastWorkspace(workspace: PracticoraWorkspace) {
  if (typeof window !== "undefined") localStorage.setItem("practicora:active-workspace", workspace.id);
  if (workspace.kind !== "organization") return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.rpc("set_active_practicora_workspace", {
    target_organization_id: workspace.organizationId,
  });
}

export async function organizationDashboard(organizationId: string): Promise<OrganizationDashboard> {
  const demoRole = readDemoRole();
  if (demoRole && demoRole !== "platform_owner" && demoRole !== "student") {
    return {
      memberCount: 148,
      studentCount: 96,
      teacherCount: 18,
      activePlacements: 74,
      reportsWaiting: demoRole === "supervisor" ? 4 : demoRole === "teacher" ? 12 : 19,
      atRiskPlacements: 7,
      completionRate: 82,
    };
  }
  const empty: OrganizationDashboard = {
    memberCount: 0,
    studentCount: 0,
    teacherCount: 0,
    activePlacements: 0,
    reportsWaiting: 0,
    atRiskPlacements: 0,
    completionRate: 0,
  };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return empty;
  const { data, error } = await supabase.rpc("organization_dashboard_metrics", {
    target_organization_id: organizationId,
  });
  if (error || !data) return empty;
  const row = data as Record<string, unknown>;
  return {
    memberCount: Number(row.member_count || 0),
    studentCount: Number(row.student_count || 0),
    teacherCount: Number(row.teacher_count || 0),
    activePlacements: Number(row.active_placements || 0),
    reportsWaiting: Number(row.reports_waiting || 0),
    atRiskPlacements: Number(row.at_risk_placements || 0),
    completionRate: Number(row.completion_rate || 0),
  };
}

export async function listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_organization_members", {
    target_organization_id: organizationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    membershipId: String(row.membership_id),
    userId: String(row.user_id),
    fullName: String(row.full_name || ""),
    email: String(row.email || ""),
    status: String(row.status || "active"),
    roles: (Array.isArray(row.roles) ? row.roles : []).map(String) as OrganizationRoleKey[],
    joinedAt: String(row.joined_at || ""),
  }));
}

export async function listPrograms(organizationId: string): Promise<OrganizationProgram[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("programs")
    .select("id,name,code,description,required_hours,status,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code || "",
    description: row.description || "",
    requiredHours: Number(row.required_hours || 0),
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function listCohorts(organizationId: string): Promise<OrganizationCohort[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_organization_cohorts", {
    target_organization_id: organizationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    programId: String(row.program_id || ""),
    programName: String(row.program_name || ""),
    name: String(row.name || ""),
    startDate: String(row.start_date || ""),
    endDate: String(row.end_date || ""),
    status: String(row.status || "active"),
    studentCount: Number(row.student_count || 0),
  }));
}

export async function listPlacements(organizationId: string): Promise<OrganizationPlacement[]> {
  const demoRole = readDemoRole();
  if (demoRole && demoRole !== "platform_owner" && demoRole !== "student") {
    return [
      { id: "demo-placement-1", studentName: "Camille Gagnon", company: "Laxson Solutions", roleTitle: "Développement logiciel", teacherName: "Nadia Benali", supervisorName: "Daniel Roy", status: "active", loggedHours: 186.5, requiredHours: 240 },
      { id: "demo-placement-2", studentName: "Samuel Kim", company: "Northstar Digital", roleTitle: "Assurance qualité", teacherName: "Nadia Benali", supervisorName: "Maya Chen", status: "at_risk", loggedHours: 121, requiredHours: 240 },
      { id: "demo-placement-3", studentName: "Amina Diallo", company: "CivicLab", roleTitle: "Analyse de données", teacherName: "Olivier Martin", supervisorName: "Daniel Roy", status: "active", loggedHours: 202, requiredHours: 240 },
      { id: "demo-placement-4", studentName: "Lucas Bernard", company: "Studio Nacre", roleTitle: "Design produit", teacherName: "Olivier Martin", supervisorName: "Maya Chen", status: "completed", loggedHours: 240, requiredHours: 240 },
    ];
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_organization_placements", {
    target_organization_id: organizationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    studentName: String(row.student_name || ""),
    company: String(row.company || ""),
    roleTitle: String(row.role_title || ""),
    teacherName: String(row.teacher_name || ""),
    supervisorName: String(row.supervisor_name || ""),
    status: String(row.status || "active"),
    loggedHours: Number(row.logged_hours || 0),
    requiredHours: Number(row.required_hours || 0),
  }));
}

export async function listInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id,email,role_key,status,expires_at,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    email: row.email,
    roleKey: row.role_key as OrganizationRoleKey,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function listInstitutionalReports(organizationId: string, locale = "fr"): Promise<InstitutionalReport[]> {
  const demoRole = readDemoRole();
  if (demoRole && demoRole !== "platform_owner" && demoRole !== "student") {
    return [
      { id: "demo-report-1", title: t(locale, "common.misc.demo_report_progress"), studentName: "Camille Gagnon", reportType: "progress", periodLabel: "1–15 juillet 2026", status: "submitted", submittedAt: "2026-07-15T14:20:00Z", updatedAt: "2026-07-15T14:20:00Z" },
      { id: "demo-report-2", title: t(locale, "common.misc.demo_report_midterm"), studentName: "Samuel Kim", reportType: "evaluation", periodLabel: "Été 2026", status: "changes_requested", submittedAt: "2026-07-14T10:00:00Z", updatedAt: "2026-07-16T09:30:00Z" },
      { id: "demo-report-3", title: t(locale, "common.misc.demo_report_skills"), studentName: "Amina Diallo", reportType: "skills", periodLabel: "Juin–juillet 2026", status: "in_review", submittedAt: "2026-07-13T18:05:00Z", updatedAt: "2026-07-16T13:10:00Z" },
      { id: "demo-report-4", title: t(locale, "common.misc.demo_report_final"), studentName: "Lucas Bernard", reportType: "final", periodLabel: "Été 2026", status: "approved", submittedAt: "2026-07-10T16:45:00Z", updatedAt: "2026-07-12T11:00:00Z" },
    ];
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_organization_reports", {
    target_organization_id: organizationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title || ""),
    studentName: String(row.student_name || ""),
    reportType: String(row.report_type || "weekly"),
    periodLabel: String(row.period_label || ""),
    status: String(row.status || "draft"),
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    updatedAt: String(row.updated_at || ""),
  }));
}

export type OrganizationAuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type OrganizationReportTemplate = {
  id: string;
  name: string;
  description: string;
  reportType: string;
  cadence: string;
  status: string;
  sections: Array<{ id: string; label: string; required: boolean; type: string }>;
  createdAt: string;
};

export async function createOrganization(input: {
  name: string;
  slug: string;
  type: string;
  country: string;
  timezone: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.rpc("create_practicora_organization", {
    organization_name: input.name,
    organization_slug: input.slug,
    organization_type: input.type,
    organization_country: input.country,
    organization_timezone: input.timezone,
  });
}

export async function createProgram(organizationId: string, input: {
  name: string;
  code: string;
  description: string;
  requiredHours: number;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.from("programs").insert({
    organization_id: organizationId,
    name: input.name,
    code: input.code,
    description: input.description,
    required_hours: input.requiredHours,
    status: "active",
  }).select("id").single();
}

export async function createCohort(organizationId: string, input: {
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.from("cohorts").insert({
    organization_id: organizationId,
    program_id: input.programId || null,
    name: input.name,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    status: "active",
  }).select("id").single();
}

export async function createInvitation(organizationId: string, input: {
  email: string;
  roleKey: OrganizationRoleKey;
  programId?: string;
  cohortId?: string;
  expiresInDays?: number;
  locale?: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };

  const delivery = await supabase.functions.invoke("send-invitation", {
    body: {
      organizationId,
      email: input.email,
      roleKey: input.roleKey,
      programId: input.programId || null,
      cohortId: input.cohortId || null,
      expiresInDays: input.expiresInDays || 14,
      locale: normalizeLocale(input.locale),
    },
  });
  if (!delivery.error && delivery.data) return delivery;

  return supabase.rpc("create_organization_invitation", {
    target_organization_id: organizationId,
    target_email: input.email,
    target_role_key: input.roleKey,
    target_program_id: input.programId || null,
    target_cohort_id: input.cohortId || null,
    expires_in_days: input.expiresInDays || 14,
  });
}

export async function acceptInvitation(token: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.rpc("accept_organization_invitation", { invitation_token: token });
}

export async function updateInstitutionalReportStatus(reportId: string, status: string, comment?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.rpc("review_report_submission", {
    target_submission_id: reportId,
    target_status: status,
    review_comment: comment || null,
  });
}

export async function listAuditEvents(organizationId: string): Promise<OrganizationAuditEvent[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("list_organization_audit_events", {
    target_organization_id: organizationId,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    action: String(row.action || ""),
    entityType: String(row.entity_type || ""),
    entityId: String(row.entity_id || ""),
    actorName: String(row.actor_name || "System"),
    createdAt: String(row.created_at || ""),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
  }));
}

export async function listReportTemplates(organizationId: string): Promise<OrganizationReportTemplate[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("report_templates")
    .select("id,name,description,report_type,cadence,status,sections,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || "",
    reportType: row.report_type,
    cadence: row.cadence,
    status: row.status,
    sections: Array.isArray(row.sections) ? row.sections : [],
    createdAt: row.created_at,
  }));
}

export async function createReportTemplate(organizationId: string, input: {
  name: string;
  description: string;
  reportType: string;
  cadence: string;
  sections: Array<{ id: string; label: string; required: boolean; type: string }>;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.from("report_templates").insert({
    organization_id: organizationId,
    name: input.name,
    description: input.description,
    report_type: input.reportType,
    cadence: input.cadence,
    sections: input.sections,
    status: "active",
  }).select("id").single();
}

export type OrganizationSettings = {
  id: string;
  name: string;
  slug: string;
  type: string;
  country: string;
  timezone: string;
  website: string;
  contactEmail: string;
  retentionMonths: number;
  allowStudentExports: boolean;
  requireEmailVerification: boolean;
  requireSupervisorApproval: boolean;
  autoArchiveCompleted: boolean;
};

export async function getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,type,country,timezone,website,contact_email,retention_months,allow_student_exports,require_email_verification,require_supervisor_approval,auto_archive_completed")
    .eq("id", organizationId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    type: data.type,
    country: data.country || "CA",
    timezone: data.timezone || "America/Toronto",
    website: data.website || "",
    contactEmail: data.contact_email || "",
    retentionMonths: Number(data.retention_months || 36),
    allowStudentExports: data.allow_student_exports !== false,
    requireEmailVerification: data.require_email_verification !== false,
    requireSupervisorApproval: Boolean(data.require_supervisor_approval),
    autoArchiveCompleted: data.auto_archive_completed !== false,
  };
}

export async function updateOrganizationSettings(organizationId: string, input: Partial<OrganizationSettings>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.type !== undefined) payload.type = input.type;
  if (input.country !== undefined) payload.country = input.country;
  if (input.timezone !== undefined) payload.timezone = input.timezone;
  if (input.website !== undefined) payload.website = input.website;
  if (input.contactEmail !== undefined) payload.contact_email = input.contactEmail;
  if (input.retentionMonths !== undefined) payload.retention_months = input.retentionMonths;
  if (input.allowStudentExports !== undefined) payload.allow_student_exports = input.allowStudentExports;
  if (input.requireEmailVerification !== undefined) payload.require_email_verification = input.requireEmailVerification;
  if (input.requireSupervisorApproval !== undefined) payload.require_supervisor_approval = input.requireSupervisorApproval;
  if (input.autoArchiveCompleted !== undefined) payload.auto_archive_completed = input.autoArchiveCompleted;
  return supabase.from("organizations").update(payload).eq("id", organizationId).select("id").single();
}

export async function createPlacement(organizationId: string, input: {
  studentUserId: string;
  company: string;
  roleTitle: string;
  teacherUserId?: string;
  supervisorUserId?: string;
  cohortId?: string;
  startDate: string;
  endDate: string;
  requiredHours: number;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.from("placements").insert({
    organization_id: organizationId,
    student_user_id: input.studentUserId,
    company: input.company,
    role_title: input.roleTitle,
    teacher_user_id: input.teacherUserId || null,
    supervisor_user_id: input.supervisorUserId || null,
    cohort_id: input.cohortId || null,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    required_hours: input.requiredHours,
    status: "active",
  }).select("id").single();
}

export type StudentPlacementContext = {
  id: string;
  organizationId: string;
  company: string;
  roleTitle: string;
  requiredHours: number;
  loggedHours: number;
  status: string;
};

export type SubmitInstitutionalReportInput = {
  title: string;
  reportType: string;
  periodStart?: string;
  periodEnd?: string;
  totalHours: number;
  content: Record<string, unknown>;
  status?: "ready" | "submitted";
};

export async function getMyActivePlacement(
  organizationId: string,
): Promise<StudentPlacementContext | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("placements")
    .select("id,organization_id,company,role_title,required_hours,logged_hours,status")
    .eq("organization_id", organizationId)
    .eq("student_user_id", userId)
    .in("status", ["planned", "active", "at_risk"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    company: data.company,
    roleTitle: data.role_title || "",
    requiredHours: Number(data.required_hours || 0),
    loggedHours: Number(data.logged_hours || 0),
    status: data.status || "active",
  };
}

export async function submitInstitutionalReport(
  organizationId: string,
  input: SubmitInstitutionalReportInput,
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { data: null, error: new Error("Supabase unavailable") };
  return supabase.rpc("submit_practicora_report", {
    target_organization_id: organizationId,
    report_title: input.title,
    report_type_value: input.reportType,
    period_start_value: input.periodStart || null,
    period_end_value: input.periodEnd || null,
    total_hours_value: input.totalHours,
    report_content: input.content,
    submission_status: input.status || "submitted",
  });
}
