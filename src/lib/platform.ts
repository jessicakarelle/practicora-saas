import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { readDemoRole } from "@/lib/demo";

export type PlatformRoleKey =
  | "platform_owner"
  | "platform_admin"
  | "platform_operations"
  | "platform_finance"
  | "platform_support"
  | "platform_auditor";

export type PlatformContext = {
  membershipId: string;
  status: "active" | "suspended" | "revoked";
  roles: PlatformRoleKey[];
  permissions: string[];
  accountStatus: "active" | "restricted" | "suspended";
};

export type PlatformDashboardMetrics = {
  organizationsTotal: number;
  organizationsActive: number;
  organizationsSuspended: number;
  usersTotal: number;
  usersActive30d: number;
  usersSuspended: number;
  subscriptionsActive: number;
  subscriptionsPastDue: number;
  reportsWaiting: number;
  supportSessionsActive: number;
  dataRequestsOpen: number;
  auditEvents24h: number;
};

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  type: string;
  country: string;
  status: "active" | "suspended" | "archived";
  memberCount: number;
  studentCount: number;
  activePlacements: number;
  subscriptionStatus: string;
  planCode: string;
  createdAt: string;
};

export type PlatformUser = {
  id: string;
  email: string;
  fullName: string;
  accountStatus: "active" | "restricted" | "suspended";
  emailConfirmed: boolean;
  organizationCount: number;
  organizationNames: string;
  lastSignInAt: string | null;
  createdAt: string;
};

export type PlatformTeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  status: "active" | "suspended" | "revoked";
  roles: PlatformRoleKey[];
  permissions: string[];
  appointedAt: string;
  lastUsedAt: string | null;
};

export type PlatformPlanPrice = {
  id: string;
  currency: string;
  billingInterval: "month" | "year" | "one_time" | "custom";
  amountCents: number;
  activeFrom: string;
  activeUntil: string | null;
  isActive: boolean;
};

export type PlatformPlanFeature = {
  key: string;
  value: unknown;
  valueType: "boolean" | "integer" | "decimal" | "text" | "json";
  nameKey: string;
};

export type PlatformPlan = {
  id: string;
  code: string;
  nameKey: string;
  descriptionKey: string;
  audience: "individual" | "organization" | "enterprise";
  status: "draft" | "active" | "archived";
  isPublic: boolean;
  sortOrder: number;
  trialDays: number;
  prices: PlatformPlanPrice[];
  features: PlatformPlanFeature[];
};

export type PlatformSubscription = {
  id: string;
  ownerType: "user" | "organization";
  ownerName: string;
  planCode: string;
  status: string;
  currency: string;
  amountCents: number;
  billingInterval: string;
  currentPeriodEnd: string | null;
  createdAt: string;
};

export type PlatformUsage = {
  subjectType: "user" | "organization";
  subjectId: string;
  subjectName: string;
  featureKey: string;
  quantity: number;
  periodStart: string;
  periodEnd: string;
  updatedAt: string;
};

export type PlatformFeatureFlag = {
  key: string;
  nameKey: string;
  descriptionKey: string;
  enabled: boolean;
  rolloutPercentage: number;
  rules: unknown[];
  updatedAt: string;
};

export type PlatformAuditEvent = {
  id: number;
  actorUserId: string | null;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const emptyContext: PlatformContext = {
  membershipId: "",
  status: "revoked",
  roles: [],
  permissions: [],
  accountStatus: "active",
};

const emptyMetrics: PlatformDashboardMetrics = {
  organizationsTotal: 0,
  organizationsActive: 0,
  organizationsSuspended: 0,
  usersTotal: 0,
  usersActive30d: 0,
  usersSuspended: 0,
  subscriptionsActive: 0,
  subscriptionsPastDue: 0,
  reportsWaiting: 0,
  supportSessionsActive: 0,
  dataRequestsOpen: 0,
  auditEvents24h: 0,
};

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function isPlatformDemo() {
  return readDemoRole() === "platform_owner";
}

export async function resolvePlatformContext(): Promise<PlatformContext> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return emptyContext;
  const { data, error } = await supabase.rpc("resolve_platform_context");
  if (error || !data) return emptyContext;
  const row = record(data);
  return {
    membershipId: String(row.membership_id || ""),
    status: row.status === "active" || row.status === "suspended" ? row.status : "revoked",
    roles: arrayOfStrings(row.roles).filter((role): role is PlatformRoleKey =>
      [
        "platform_owner",
        "platform_admin",
        "platform_operations",
        "platform_finance",
        "platform_support",
        "platform_auditor",
      ].includes(role),
    ),
    permissions: arrayOfStrings(row.permissions),
    accountStatus:
      row.account_status === "restricted" || row.account_status === "suspended"
        ? row.account_status
        : "active",
  };
}

export async function loadPlatformDashboard(): Promise<PlatformDashboardMetrics> {
  if (isPlatformDemo()) return { organizationsTotal: 24, organizationsActive: 21, organizationsSuspended: 2, usersTotal: 3864, usersActive30d: 2948, usersSuspended: 7, subscriptionsActive: 18, subscriptionsPastDue: 2, reportsWaiting: 43, supportSessionsActive: 3, dataRequestsOpen: 5, auditEvents24h: 128 };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return emptyMetrics;
  const { data, error } = await supabase.rpc("platform_dashboard_metrics");
  if (error || !data) return emptyMetrics;
  const row = record(data);
  return {
    organizationsTotal: Number(row.organizations_total || 0),
    organizationsActive: Number(row.organizations_active || 0),
    organizationsSuspended: Number(row.organizations_suspended || 0),
    usersTotal: Number(row.users_total || 0),
    usersActive30d: Number(row.users_active_30d || 0),
    usersSuspended: Number(row.users_suspended || 0),
    subscriptionsActive: Number(row.subscriptions_active || 0),
    subscriptionsPastDue: Number(row.subscriptions_past_due || 0),
    reportsWaiting: Number(row.reports_waiting || 0),
    supportSessionsActive: Number(row.support_sessions_active || 0),
    dataRequestsOpen: Number(row.data_requests_open || 0),
    auditEvents24h: Number(row.audit_events_24h || 0),
  };
}

export async function listPlatformOrganizations(search = "", status = "all") {
  if (isPlatformDemo()) {
    const rows: PlatformOrganization[] = [
      { id: "org-1", name: "Institut Practicora Démo", slug: "practicora-demo", type: "college", country: "CA", status: "active", memberCount: 148, studentCount: 96, activePlacements: 74, subscriptionStatus: "active", planCode: "institution", createdAt: "2026-02-10T12:00:00Z" },
      { id: "org-2", name: "Collège Horizon", slug: "college-horizon", type: "college", country: "CA", status: "active", memberCount: 412, studentCount: 330, activePlacements: 286, subscriptionStatus: "active", planCode: "enterprise", createdAt: "2026-03-18T09:00:00Z" },
      { id: "org-3", name: "Université Nova", slug: "universite-nova", type: "university", country: "FR", status: "active", memberCount: 870, studentCount: 731, activePlacements: 612, subscriptionStatus: "trialing", planCode: "institution", createdAt: "2026-04-02T14:00:00Z" },
      { id: "org-4", name: "Académie Atlas", slug: "academie-atlas", type: "school", country: "CM", status: "suspended", memberCount: 76, studentCount: 58, activePlacements: 41, subscriptionStatus: "past_due", planCode: "institution", createdAt: "2026-05-21T16:30:00Z" },
    ];
    return rows.filter((row) => (status === "all" || row.status === status) && (!search || `${row.name} ${row.slug} ${row.country}`.toLowerCase().includes(search.toLowerCase())));
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformOrganization[];
  const { data, error } = await supabase.rpc("list_platform_organizations", {
    search_text: search,
    status_filter: status,
    page_limit: 200,
    page_offset: 0,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      id: String(row.organization_id),
      name: String(row.name || ""),
      slug: String(row.slug || ""),
      type: String(row.organization_type || ""),
      country: String(row.country || ""),
      status:
        row.status === "suspended" || row.status === "archived" ? row.status : "active",
      memberCount: Number(row.member_count || 0),
      studentCount: Number(row.student_count || 0),
      activePlacements: Number(row.active_placements || 0),
      subscriptionStatus: String(row.subscription_status || "none"),
      planCode: String(row.plan_code || ""),
      createdAt: String(row.created_at || ""),
    } satisfies PlatformOrganization;
  });
}

export async function listPlatformUsers(search = "", status = "all") {
  if (isPlatformDemo()) {
    const rows: PlatformUser[] = [
      { id: "user-1", email: "admin@demo.practicora.local", fullName: "Sophie Tremblay", accountStatus: "active", emailConfirmed: true, organizationCount: 1, organizationNames: "Institut Practicora Démo", lastSignInAt: "2026-07-17T11:20:00Z", createdAt: "2026-02-10T12:05:00Z" },
      { id: "user-2", email: "teacher@demo.practicora.local", fullName: "Nadia Benali", accountStatus: "active", emailConfirmed: true, organizationCount: 1, organizationNames: "Institut Practicora Démo", lastSignInAt: "2026-07-17T10:48:00Z", createdAt: "2026-02-12T13:00:00Z" },
      { id: "user-3", email: "student@demo.practicora.local", fullName: "Camille Gagnon", accountStatus: "active", emailConfirmed: true, organizationCount: 1, organizationNames: "Institut Practicora Démo", lastSignInAt: "2026-07-17T11:02:00Z", createdAt: "2026-05-01T08:15:00Z" },
      { id: "user-4", email: "review@example.test", fullName: "Jordan Lee", accountStatus: "restricted", emailConfirmed: false, organizationCount: 2, organizationNames: "Collège Horizon, Université Nova", lastSignInAt: "2026-07-12T09:30:00Z", createdAt: "2026-04-14T10:00:00Z" },
    ];
    return rows.filter((row) => (status === "all" || row.accountStatus === status) && (!search || `${row.fullName} ${row.email} ${row.organizationNames}`.toLowerCase().includes(search.toLowerCase())));
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformUser[];
  const { data, error } = await supabase.rpc("list_platform_users", {
    search_text: search,
    status_filter: status,
    page_limit: 200,
    page_offset: 0,
  });
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      id: String(row.user_id),
      email: String(row.email || ""),
      fullName: String(row.full_name || ""),
      accountStatus:
        row.account_status === "restricted" || row.account_status === "suspended"
          ? row.account_status
          : "active",
      emailConfirmed: Boolean(row.email_confirmed),
      organizationCount: Number(row.organization_count || 0),
      organizationNames: String(row.organization_names || ""),
      lastSignInAt: row.last_sign_in_at ? String(row.last_sign_in_at) : null,
      createdAt: String(row.created_at || ""),
    } satisfies PlatformUser;
  });
}

export async function listPlatformTeam() {
  if (isPlatformDemo()) return [{ membershipId: "demo-platform-membership", userId: "demo-platform-user", email: "platform@demo.practicora.local", fullName: "Alex Morgan", status: "active", roles: ["platform_owner"], permissions: ["platform.dashboard.view", "platform.organizations.create", "platform.organizations.manage", "platform.users.manage", "platform.settings.manage"], appointedAt: "2026-01-10T12:00:00Z", lastUsedAt: "2026-07-17T11:45:00Z" }] satisfies PlatformTeamMember[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformTeamMember[];
  const { data, error } = await supabase.rpc("list_platform_team");
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      membershipId: String(row.membership_id),
      userId: String(row.user_id),
      email: String(row.email || ""),
      fullName: String(row.full_name || ""),
      status: row.status === "suspended" || row.status === "revoked" ? row.status : "active",
      roles: arrayOfStrings(row.roles) as PlatformRoleKey[],
      permissions: arrayOfStrings(row.permissions),
      appointedAt: String(row.appointed_at || ""),
      lastUsedAt: row.last_used_at ? String(row.last_used_at) : null,
    } satisfies PlatformTeamMember;
  });
}

export async function listPlatformPlans() {
  if (isPlatformDemo()) return [
    { id: "plan-free", code: "free", nameKey: "billing.plans.free_name", descriptionKey: "billing.plans.free_description", audience: "individual", status: "active", isPublic: true, sortOrder: 1, trialDays: 0, prices: [], features: [{ key: "journal_entries_month", value: 30, valueType: "integer", nameKey: "billing.features.journal_entries" }] },
    { id: "plan-plus", code: "plus", nameKey: "billing.plans.plus_name", descriptionKey: "billing.plans.plus_description", audience: "individual", status: "draft", isPublic: false, sortOrder: 2, trialDays: 14, prices: [{ id: "price-plus-cad", currency: "CAD", billingInterval: "month", amountCents: 900, activeFrom: "2026-07-01", activeUntil: null, isActive: true }], features: [{ key: "journal_entries_month", value: 500, valueType: "integer", nameKey: "billing.features.journal_entries" }] },
    { id: "plan-institution", code: "institution", nameKey: "billing.plans.institution_name", descriptionKey: "billing.plans.institution_description", audience: "organization", status: "draft", isPublic: false, sortOrder: 3, trialDays: 30, prices: [{ id: "price-inst-cad", currency: "CAD", billingInterval: "year", amountCents: 249900, activeFrom: "2026-07-01", activeUntil: null, isActive: true }], features: [{ key: "organization_members", value: 500, valueType: "integer", nameKey: "billing.features.organization_members" }] },
  ] satisfies PlatformPlan[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformPlan[];
  const { data, error } = await supabase.rpc("list_platform_plans");
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    const prices = Array.isArray(row.prices) ? row.prices : [];
    const features = Array.isArray(row.features) ? row.features : [];
    return {
      id: String(row.id),
      code: String(row.code),
      nameKey: String(row.name_key || ""),
      descriptionKey: String(row.description_key || ""),
      audience:
        row.audience === "organization" || row.audience === "enterprise"
          ? row.audience
          : "individual",
      status: row.status === "active" || row.status === "archived" ? row.status : "draft",
      isPublic: Boolean(row.is_public),
      sortOrder: Number(row.sort_order || 0),
      trialDays: Number(row.trial_days || 0),
      prices: prices.map((item) => {
        const price = record(item);
        return {
          id: String(price.id),
          currency: String(price.currency || "CAD"),
          billingInterval:
            price.billing_interval === "month" ||
            price.billing_interval === "year" ||
            price.billing_interval === "one_time"
              ? price.billing_interval
              : "custom",
          amountCents: Number(price.amount_cents || 0),
          activeFrom: String(price.active_from || ""),
          activeUntil: price.active_until ? String(price.active_until) : null,
          isActive: Boolean(price.is_active),
        } satisfies PlatformPlanPrice;
      }),
      features: features.map((item) => {
        const feature = record(item);
        return {
          key: String(feature.key || ""),
          value: feature.value,
          valueType:
            feature.value_type === "integer" ||
            feature.value_type === "decimal" ||
            feature.value_type === "text" ||
            feature.value_type === "json"
              ? feature.value_type
              : "boolean",
          nameKey: String(feature.name_key || ""),
        } satisfies PlatformPlanFeature;
      }),
    } satisfies PlatformPlan;
  });
}

export async function listPlatformSubscriptions() {
  if (isPlatformDemo()) return [
    { id: "sub-1", ownerType: "organization", ownerName: "Institut Practicora Démo", planCode: "institution", status: "active", currency: "CAD", amountCents: 249900, billingInterval: "year", currentPeriodEnd: "2027-02-10", createdAt: "2026-02-10" },
    { id: "sub-2", ownerType: "organization", ownerName: "Collège Horizon", planCode: "enterprise", status: "active", currency: "CAD", amountCents: 0, billingInterval: "custom", currentPeriodEnd: "2027-03-18", createdAt: "2026-03-18" },
    { id: "sub-3", ownerType: "organization", ownerName: "Académie Atlas", planCode: "institution", status: "past_due", currency: "CAD", amountCents: 249900, billingInterval: "year", currentPeriodEnd: "2026-07-01", createdAt: "2026-05-21" },
  ] satisfies PlatformSubscription[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformSubscription[];
  const { data, error } = await supabase.rpc("list_platform_subscriptions", { page_limit: 500 });
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      id: String(row.subscription_id),
      ownerType: row.owner_type === "organization" ? "organization" : "user",
      ownerName: String(row.owner_name || ""),
      planCode: String(row.plan_code || ""),
      status: String(row.status || ""),
      currency: String(row.currency || "CAD"),
      amountCents: Number(row.amount_cents || 0),
      billingInterval: String(row.billing_interval || "custom"),
      currentPeriodEnd: row.current_period_end ? String(row.current_period_end) : null,
      createdAt: String(row.created_at || ""),
    } satisfies PlatformSubscription;
  });
}

export async function listPlatformUsage() {
  if (isPlatformDemo()) return [
    { subjectType: "organization", subjectId: "org-1", subjectName: "Institut Practicora Démo", featureKey: "journal_entries", quantity: 2840, periodStart: "2026-07-01", periodEnd: "2026-07-31", updatedAt: "2026-07-17T11:00:00Z" },
    { subjectType: "organization", subjectId: "org-2", subjectName: "Collège Horizon", featureKey: "report_exports", quantity: 418, periodStart: "2026-07-01", periodEnd: "2026-07-31", updatedAt: "2026-07-17T10:30:00Z" },
    { subjectType: "user", subjectId: "user-3", subjectName: "Camille Gagnon", featureKey: "assistant_messages", quantity: 36, periodStart: "2026-07-01", periodEnd: "2026-07-31", updatedAt: "2026-07-17T09:45:00Z" },
  ] satisfies PlatformUsage[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformUsage[];
  const { data, error } = await supabase.rpc("list_platform_usage", { page_limit: 1000 });
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      subjectType: row.subject_type === "organization" ? "organization" : "user",
      subjectId: String(row.subject_id),
      subjectName: String(row.subject_name || ""),
      featureKey: String(row.feature_key || ""),
      quantity: Number(row.quantity || 0),
      periodStart: String(row.period_start || ""),
      periodEnd: String(row.period_end || ""),
      updatedAt: String(row.updated_at || ""),
    } satisfies PlatformUsage;
  });
}

export async function listPlatformFeatureFlags() {
  if (isPlatformDemo()) return [
    { key: "assistant_uploads", nameKey: "platform.flags.assistant_uploads", descriptionKey: "platform.flags.assistant_uploads_description", enabled: true, rolloutPercentage: 100, rules: [], updatedAt: "2026-07-16T12:00:00Z" },
    { key: "advanced_reports", nameKey: "platform.flags.advanced_reports", descriptionKey: "platform.flags.advanced_reports_description", enabled: true, rolloutPercentage: 65, rules: [{ audience: "institution" }], updatedAt: "2026-07-15T09:00:00Z" },
  ] satisfies PlatformFeatureFlag[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformFeatureFlag[];
  const { data, error } = await supabase.rpc("list_platform_feature_flags");
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      key: String(row.key),
      nameKey: String(row.name_key || ""),
      descriptionKey: String(row.description_key || ""),
      enabled: Boolean(row.enabled),
      rolloutPercentage: Number(row.rollout_percentage || 0),
      rules: Array.isArray(row.rules) ? row.rules : [],
      updatedAt: String(row.updated_at || ""),
    } satisfies PlatformFeatureFlag;
  });
}

export async function listPlatformAuditEvents() {
  if (isPlatformDemo()) return [
    { id: 101, actorUserId: "demo-platform-user", actorEmail: "platform@demo.practicora.local", action: "organization.status.updated", targetType: "organization", targetId: "org-4", reason: "Paiement en retard — démonstration", metadata: { previous: "active", next: "suspended" }, createdAt: "2026-07-17T10:12:00Z" },
    { id: 100, actorUserId: "demo-platform-user", actorEmail: "platform@demo.practicora.local", action: "feature.rollout.updated", targetType: "feature_flag", targetId: "advanced_reports", reason: "Déploiement progressif", metadata: { rolloutPercentage: 65 }, createdAt: "2026-07-16T15:40:00Z" },
  ] satisfies PlatformAuditEvent[];
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformAuditEvent[];
  const { data, error } = await supabase.rpc("list_platform_audit_events", { page_limit: 500 });
  if (error || !Array.isArray(data)) return [];
  return data.map((value) => {
    const row = record(value);
    return {
      id: Number(row.event_id || 0),
      actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
      actorEmail: String(row.actor_email || ""),
      action: String(row.action || ""),
      targetType: String(row.target_type || ""),
      targetId: String(row.target_id || ""),
      reason: String(row.reason || ""),
      metadata: record(row.metadata),
      createdAt: String(row.created_at || ""),
    } satisfies PlatformAuditEvent;
  });
}

export async function setPlatformOrganizationStatus(
  organizationId: string,
  status: "active" | "suspended" | "archived",
  reason: string,
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("set_platform_organization_status", {
    target_organization_id: organizationId,
    target_status: status,
    target_reason: reason,
  });
  if (error) throw error;
}

export async function setPlatformAccountStatus(
  userId: string,
  status: "active" | "restricted" | "suspended",
  reason: string,
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("set_platform_account_status", {
    target_user_id: userId,
    target_status: status,
    target_reason: reason,
    target_locked_until: null,
  });
  if (error) throw error;
}

export async function assignPlatformRole(email: string, role: PlatformRoleKey, notes = "") {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("assign_platform_role_by_email", {
    target_email: email,
    target_role_key: role,
    target_notes: notes,
  });
  if (error) throw error;
}

export async function removePlatformRole(userId: string, role: PlatformRoleKey, reason = "") {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("remove_platform_role", {
    target_user_id: userId,
    target_role_key: role,
    target_reason: reason,
  });
  if (error) throw error;
}

export async function updatePlatformPlan(
  planId: string,
  status: PlatformPlan["status"],
  isPublic: boolean,
  trialDays: number,
  reason = "",
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("update_platform_plan", {
    target_plan_id: planId,
    target_status: status,
    target_is_public: isPublic,
    target_trial_days: trialDays,
    target_reason: reason,
  });
  if (error) throw error;
}

export async function updatePlatformPlanFeature(planId: string, featureKey: string, value: unknown) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("update_platform_plan_feature", {
    target_plan_id: planId,
    target_feature_key: featureKey,
    target_value: value,
  });
  if (error) throw error;
}

export async function updatePlatformFeatureFlag(
  key: string,
  enabled: boolean,
  rolloutPercentage: number,
  reason = "",
) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("set_platform_feature_flag", {
    target_key: key,
    target_enabled: enabled,
    target_rollout_percentage: rolloutPercentage,
    target_reason: reason,
  });
  if (error) throw error;
}

export type PlatformSupportSession = {
  id: string;
  operatorUserId: string;
  targetType: "user" | "organization";
  targetId: string;
  mode: "read_only" | "assisted_write";
  reason: string;
  status: "active" | "ended" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
};

export type PlatformDataRequest = {
  id: string;
  requestType: "export" | "deletion" | "retention_hold" | "restore";
  subjectType: "user" | "organization";
  subjectId: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  reason: string;
  resultLocation: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export type PlatformSetting = {
  key: string;
  value: Record<string, unknown>;
  isPublic: boolean;
  updatedAt: string;
};

export async function listPlatformSupportSessions() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformSupportSession[];
  const { data, error } = await supabase
    .from("platform_support_sessions")
    .select("id,operator_user_id,target_type,target_id,mode,reason,status,expires_at,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    id: String(row.id),
    operatorUserId: String(row.operator_user_id),
    targetType: row.target_type === "organization" ? "organization" : "user",
    targetId: String(row.target_id),
    mode: row.mode === "assisted_write" ? "assisted_write" : "read_only",
    reason: String(row.reason || ""),
    status: row.status === "ended" || row.status === "expired" || row.status === "revoked" ? row.status : "active",
    expiresAt: String(row.expires_at || ""),
    createdAt: String(row.created_at || ""),
  } satisfies PlatformSupportSession));
}

export async function startPlatformSupportSession(input: {
  targetType: "user" | "organization";
  targetId: string;
  mode: "read_only" | "assisted_write";
  reason: string;
  durationMinutes: number;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { data, error } = await supabase.rpc("start_platform_support_session", {
    target_type: input.targetType,
    target_id: input.targetId,
    target_mode: input.mode,
    target_reason: input.reason,
    duration_minutes: input.durationMinutes,
  });
  if (error) throw error;
  return String(data || "");
}

export async function endPlatformSupportSession(sessionId: string, reason = "") {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("end_platform_support_session", {
    target_session_id: sessionId,
    target_reason: reason,
  });
  if (error) throw error;
}

export async function listPlatformDataRequests() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformDataRequest[];
  const { data, error } = await supabase
    .from("platform_data_requests")
    .select("id,request_type,subject_type,subject_id,status,reason,result_location,requested_at,completed_at")
    .order("requested_at", { ascending: false })
    .limit(300);
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    id: String(row.id),
    requestType: row.request_type === "deletion" || row.request_type === "retention_hold" || row.request_type === "restore" ? row.request_type : "export",
    subjectType: row.subject_type === "organization" ? "organization" : "user",
    subjectId: String(row.subject_id),
    status: row.status === "processing" || row.status === "completed" || row.status === "failed" || row.status === "cancelled" ? row.status : "queued",
    reason: String(row.reason || ""),
    resultLocation: row.result_location ? String(row.result_location) : null,
    requestedAt: String(row.requested_at || ""),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  } satisfies PlatformDataRequest));
}

export async function createPlatformDataRequest(input: {
  requestType: PlatformDataRequest["requestType"];
  subjectType: PlatformDataRequest["subjectType"];
  subjectId: string;
  reason: string;
}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { data, error } = await supabase.rpc("create_platform_data_request", {
    target_request_type: input.requestType,
    target_subject_type: input.subjectType,
    target_subject_id: input.subjectId,
    target_reason: input.reason,
  });
  if (error) throw error;
  return String(data || "");
}

export async function listPlatformSettings() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [] as PlatformSetting[];
  const { data, error } = await supabase
    .from("platform_settings")
    .select("key,value,is_public,updated_at")
    .order("key");
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    key: String(row.key),
    value: record(row.value),
    isPublic: Boolean(row.is_public),
    updatedAt: String(row.updated_at || ""),
  } satisfies PlatformSetting));
}

export async function updatePlatformSetting(key: string, value: Record<string, unknown>, isPublic = false) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("PLATFORM_NOT_CONFIGURED");
  const { error } = await supabase.rpc("update_platform_setting", {
    target_key: key,
    target_value: value,
    target_is_public: isPublic,
  });
  if (error) throw error;
}
