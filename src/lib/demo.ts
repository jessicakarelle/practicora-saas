import { translate as t } from "@/i18n";
import type { PlatformContext } from "@/lib/platform";
import type {
  OrganizationRoleKey,
  OrganizationWorkspace,
  WorkspaceContext,
} from "@/lib/organization";

export const DEMO_STORAGE_KEY = "practicora:demo-role:v1";
export const DEMO_PASSWORD = "Practicora-Demo-2026!";

export type DemoRoleKey =
  | "platform_owner"
  | "institution_admin"
  | "program_manager"
  | "teacher"
  | "supervisor"
  | "student";

export type DemoAccount = {
  role: DemoRoleKey;
  email: string;
  fullName: string;
  organizationRole?: OrganizationRoleKey;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "platform_owner",
    email: "platform@demo.practicora.local",
    fullName: "Alex Morgan",
  },
  {
    role: "institution_admin",
    email: "admin@demo.practicora.local",
    fullName: "Sophie Tremblay",
    organizationRole: "admin",
  },
  {
    role: "program_manager",
    email: "program@demo.practicora.local",
    fullName: "Marc Dubois",
    organizationRole: "program_manager",
  },
  {
    role: "teacher",
    email: "teacher@demo.practicora.local",
    fullName: "Nadia Benali",
    organizationRole: "teacher",
  },
  {
    role: "supervisor",
    email: "supervisor@demo.practicora.local",
    fullName: "Daniel Roy",
    organizationRole: "supervisor",
  },
  {
    role: "student",
    email: "student@demo.practicora.local",
    fullName: "Camille Gagnon",
    organizationRole: "student",
  },
];

const PLATFORM_PERMISSIONS = [
  "platform.dashboard.view",
  "platform.organizations.view",
  "platform.organizations.create",
  "platform.organizations.manage",
  "platform.users.view",
  "platform.users.manage",
  "platform.access.view",
  "platform.access.manage",
  "platform.plans.view",
  "platform.plans.manage",
  "platform.subscriptions.view",
  "platform.subscriptions.manage",
  "platform.usage.view",
  "platform.features.view",
  "platform.features.manage",
  "platform.security.view",
  "platform.support.view",
  "platform.support.manage",
  "platform.data.view",
  "platform.data.manage",
  "platform.audit.view",
  "platform.settings.view",
  "platform.settings.manage",
];

const ORGANIZATION_PERMISSIONS: Record<Exclude<DemoRoleKey, "platform_owner" | "student">, string[]> = {
  institution_admin: [
    "students.view",
    "placements.view",
    "reports.review",
    "programs.view",
    "programs.manage",
    "cohorts.view",
    "cohorts.manage",
    "templates.view",
    "templates.manage",
    "members.view",
    "members.invite",
    "members.manage",
    "analytics.view",
    "audit.view",
    "organization.configure",
  ],
  program_manager: [
    "students.view",
    "placements.view",
    "reports.review",
    "programs.view",
    "cohorts.view",
    "cohorts.manage",
    "templates.view",
    "analytics.view",
  ],
  teacher: [
    "students.view_assigned",
    "placements.view_assigned",
    "reports.review",
    "reports.comment",
    "analytics.view",
  ],
  supervisor: [
    "students.view_assigned",
    "placements.view_assigned",
    "hours.confirm",
    "reports.comment",
  ],
};

export function isDemoModeAvailable() {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === "true";
}

export function findDemoAccount(email: string, password: string) {
  if (!isDemoModeAvailable() || password !== DEMO_PASSWORD) return null;
  return DEMO_ACCOUNTS.find((account) => account.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function readDemoRole(): DemoRoleKey | null {
  if (typeof window === "undefined" || !isDemoModeAvailable()) return null;
  const value = localStorage.getItem(DEMO_STORAGE_KEY);
  return DEMO_ACCOUNTS.some((account) => account.role === value) ? (value as DemoRoleKey) : null;
}

export function writeDemoRole(role: DemoRoleKey | null) {
  if (typeof window === "undefined") return;
  if (role) localStorage.setItem(DEMO_STORAGE_KEY, role);
  else localStorage.removeItem(DEMO_STORAGE_KEY);
}

function demoPlatformContext(enabled: boolean): PlatformContext {
  return enabled
    ? {
        membershipId: "demo-platform-membership",
        status: "active",
        roles: ["platform_owner"],
        permissions: PLATFORM_PERMISSIONS,
        accountStatus: "active",
      }
    : {
        membershipId: "",
        status: "revoked",
        roles: [],
        permissions: [],
        accountStatus: "active",
      };
}

export function resolveDemoWorkspaceContext(locale: string, role: DemoRoleKey, personalName: string): WorkspaceContext {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role) || DEMO_ACCOUNTS.at(-1)!;
  const personal = {
    id: "personal" as const,
    kind: "personal" as const,
    name: personalName,
    roleKeys: ["student"] as ["student"],
    permissions: ["personal.manage"],
  };

  if (role === "platform_owner") {
    const platform = demoPlatformContext(true);
    return {
      profile: { id: "demo-platform-user", email: account.email, fullName: account.fullName },
      workspaces: [
        personal,
        {
          id: "platform",
          kind: "platform",
          name: t(locale, "common.navigation.platform"),
          roleKeys: ["platform_owner"],
          permissions: PLATFORM_PERMISSIONS,
          status: "active",
        },
      ],
      recommendedWorkspaceId: "platform",
      platform,
    };
  }

  if (role === "student") {
    return {
      profile: { id: "demo-student-user", email: account.email, fullName: account.fullName },
      workspaces: [personal],
      recommendedWorkspaceId: "personal",
      platform: demoPlatformContext(false),
    };
  }

  const permissions = ORGANIZATION_PERMISSIONS[role];
  const organizationRole = account.organizationRole || "student";
  const organization: OrganizationWorkspace = {
    id: "organization:demo-institute",
    kind: "organization",
    organizationId: "demo-institute",
    membershipId: `demo-${role}-membership`,
    name: t(locale, "common.organization.demo_institution_name"),
    slug: "practicora-demo-institute",
    roleKeys: [organizationRole],
    permissions,
    status: "active",
  };

  return {
    profile: { id: `demo-${role}-user`, email: account.email, fullName: account.fullName },
    workspaces: [personal, organization],
    recommendedWorkspaceId: organization.id,
    platform: demoPlatformContext(false),
  };
}
