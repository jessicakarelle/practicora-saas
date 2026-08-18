"use client";

import { translate as t } from "@/i18n";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleUserRound,
  ClipboardCheck,
  ClipboardList,
  Coins,
  CreditCard,
  Crown,
  ChevronDown,
  FilePenLine,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  Goal,
  GraduationCap,
  History,
  LayoutTemplate,
  LockKeyhole,
  LifeBuoy,
  MailPlus,
  Network,
  ShieldAlert,
  SlidersHorizontal,
  NotebookPen,
  Orbit,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Trash2,
  UserRoundCog,
  UserCog,
  ToggleRight,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { WorkspaceSwitcher } from "@/components/app/workspace-switcher";
import { isPathProtected } from "@/lib/security";
import { useStageLog } from "@/lib/store";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Gauge;
  exact?: boolean;
  permission?: string;
};

type NavGroup = { label: string; items: NavItem[] };

function personalGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.overview"),
      items: [
        {
          label: t(locale, "common.navigation.dashboard"),
          href: `/${locale}/app`,
          icon: Gauge,
          exact: true,
        },
        {
          label: t(locale, "common.navigation.week"),
          href: `/${locale}/app/week`,
          icon: CalendarDays,
        },
        {
          label: t(locale, "common.navigation.calendar"),
          href: `/${locale}/app/calendar`,
          icon: CalendarDays,
        },
      ],
    },
    {
      label: t(locale, "common.navigation.journal"),
      items: [
        {
          label: t(locale, "common.navigation.new_entry"),
          href: `/${locale}/app/journal/new`,
          icon: NotebookPen,
        },
        {
          label: t(locale, "common.navigation.drafts"),
          href: `/${locale}/app/journal/drafts`,
          icon: FilePenLine,
        },
        {
          label: t(locale, "common.navigation.history"),
          href: `/${locale}/app/journal/history`,
          icon: History,
        },
        {
          label: t(locale, "common.navigation.notes"),
          href: `/${locale}/app/notes`,
          icon: StickyNote,
        },
      ],
    },
    {
      label: t(locale, "common.navigation.progress"),
      items: [
        {
          label: t(locale, "common.navigation.objectives"),
          href: `/${locale}/app/objectives`,
          icon: Goal,
        },
        {
          label: t(locale, "common.navigation.skills"),
          href: `/${locale}/app/skills`,
          icon: Sparkles,
        },
        {
          label: t(locale, "common.navigation.evaluation"),
          href: `/${locale}/app/evaluation`,
          icon: ClipboardCheck,
        },
        {
          label: t(locale, "common.navigation.analytics"),
          href: `/${locale}/app/analytics`,
          icon: BarChart3,
        },
      ],
    },
    {
      label: t(locale, "common.navigation.management"),
      items: [
        {
          label: t(locale, "common.navigation.internships"),
          href: `/${locale}/app/internships`,
          icon: BriefcaseBusiness,
        },
        {
          label: t(locale, "common.navigation.compensation"),
          href: `/${locale}/app/compensation`,
          icon: Coins,
        },
        {
          label: t(locale, "common.navigation.reports"),
          href: `/${locale}/app/reports`,
          icon: FileText,
        },
        {
          label: t(locale, "common.navigation.account"),
          href: `/${locale}/app/account`,
          icon: CircleUserRound,
        },
        {
          label: t(locale, "common.navigation.settings"),
          href: `/${locale}/app/settings`,
          icon: Settings,
        },
        {
          label: t(locale, "common.navigation.trash"),
          href: `/${locale}/app/trash`,
          icon: Trash2,
        },
      ],
    },
  ];
}

function organizationGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.operations"),
      items: [
        {
          label: t(locale, "common.navigation.institution_dashboard"),
          href: `/${locale}/app/organization`,
          icon: Building2,
          exact: true,
        },
        {
          label: t(locale, "common.navigation.students"),
          href: `/${locale}/app/organization/students`,
          icon: GraduationCap,
          permission: "students.view",
        },
        {
          label: t(locale, "common.navigation.placements"),
          href: `/${locale}/app/organization/placements`,
          icon: BriefcaseBusiness,
          permission: "placements.view",
        },
        {
          label: t(locale, "common.navigation.report_review"),
          href: `/${locale}/app/organization/reports`,
          icon: FileCheck2,
          permission: "reports.review",
        },
      ],
    },
    {
      label: t(locale, "common.navigation.structure"),
      items: [
        {
          label: t(locale, "common.navigation.programs"),
          href: `/${locale}/app/organization/programs`,
          icon: School,
          permission: "programs.view",
        },
        {
          label: t(locale, "common.navigation.cohorts"),
          href: `/${locale}/app/organization/cohorts`,
          icon: Users,
          permission: "cohorts.view",
        },
        {
          label: t(locale, "common.navigation.templates"),
          href: `/${locale}/app/organization/templates`,
          icon: LayoutTemplate,
          permission: "templates.view",
        },
      ],
    },
    {
      label: t(locale, "common.navigation.administration"),
      items: [
        {
          label: t(locale, "common.navigation.members_and_roles"),
          href: `/${locale}/app/organization/members`,
          icon: UserRoundCog,
          permission: "members.view",
        },
        {
          label: t(locale, "common.navigation.invitations"),
          href: `/${locale}/app/organization/invitations`,
          icon: MailPlus,
          permission: "members.invite",
        },
        {
          label: t(locale, "common.navigation.analytics"),
          href: `/${locale}/app/organization/analytics`,
          icon: BarChart3,
          permission: "analytics.view",
        },
        {
          label: t(locale, "common.navigation.audit_log"),
          href: `/${locale}/app/organization/audit`,
          icon: Activity,
          permission: "audit.view",
        },
        {
          label: t(locale, "common.navigation.settings"),
          href: `/${locale}/app/organization/settings`,
          icon: Settings,
          permission: "organization.configure",
        },
      ],
    },
  ];
}

function teachingGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.teaching"),
      items: [
        {
          label: t(locale, "common.navigation.dashboard"),
          href: `/${locale}/app/teaching`,
          icon: Gauge,
          exact: true,
        },
        {
          label: t(locale, "common.navigation.my_students"),
          href: `/${locale}/app/organization/students`,
          icon: GraduationCap,
          permission: "students.view_assigned",
        },
        {
          label: t(locale, "common.navigation.reports_to_review"),
          href: `/${locale}/app/organization/reports`,
          icon: FileCheck2,
          permission: "reports.review",
        },
        {
          label: t(locale, "common.navigation.assigned_placements"),
          href: `/${locale}/app/organization/placements`,
          icon: BriefcaseBusiness,
          permission: "placements.view_assigned",
        },
      ],
    },
  ];
}

function supervisionGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.supervision"),
      items: [
        {
          label: t(locale, "common.navigation.dashboard"),
          href: `/${locale}/app/supervision`,
          icon: Gauge,
          exact: true,
        },
        {
          label: t(locale, "common.navigation.assigned_interns"),
          href: `/${locale}/app/organization/students`,
          icon: GraduationCap,
          permission: "students.view_assigned",
        },
        {
          label: t(locale, "common.navigation.hours_and_approvals"),
          href: `/${locale}/app/organization/placements`,
          icon: ClipboardList,
          permission: "hours.confirm",
        },
        {
          label: t(locale, "common.navigation.reports_to_comment"),
          href: `/${locale}/app/organization/reports`,
          icon: FileCheck2,
          permission: "reports.comment",
        },
      ],
    },
  ];
}

function programGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.program"),
      items: [
        {
          label: t(locale, "common.navigation.dashboard"),
          href: `/${locale}/app/program`,
          icon: Gauge,
          exact: true,
        },
        {
          label: t(locale, "common.navigation.cohorts"),
          href: `/${locale}/app/organization/cohorts`,
          icon: Users,
          permission: "cohorts.view",
        },
        {
          label: t(locale, "common.navigation.students"),
          href: `/${locale}/app/organization/students`,
          icon: GraduationCap,
          permission: "students.view",
        },
        {
          label: t(locale, "common.navigation.reports"),
          href: `/${locale}/app/organization/reports`,
          icon: FileCheck2,
          permission: "reports.review",
        },
        {
          label: t(locale, "common.navigation.analytics"),
          href: `/${locale}/app/organization/analytics`,
          icon: BarChart3,
          permission: "analytics.view",
        },
      ],
    },
  ];
}

function platformGroups(locale: string): NavGroup[] {
  return [
    {
      label: t(locale, "common.navigation.platform_operations"),
      items: [
        {
          label: t(locale, "common.navigation.platform_dashboard"),
          href: `/${locale}/app/platform`,
          icon: Crown,
          exact: true,
          permission: "platform.dashboard.view",
        },
        {
          label: t(locale, "common.navigation.platform_institutions"),
          href: `/${locale}/app/platform/institutions`,
          icon: Building2,
          permission: "platform.organizations.view",
        },
        {
          label: t(locale, "common.navigation.platform_users"),
          href: `/${locale}/app/platform/users`,
          icon: Users,
          permission: "platform.users.view",
        },
        {
          label: t(locale, "common.navigation.platform_access"),
          href: `/${locale}/app/platform/access`,
          icon: UserCog,
          permission: "platform.access.view",
        },
      ],
    },
    {
      label: t(locale, "common.navigation.platform_commerce"),
      items: [
        {
          label: t(locale, "common.navigation.platform_plans"),
          href: `/${locale}/app/platform/plans`,
          icon: CreditCard,
          permission: "platform.plans.view",
        },
        {
          label: t(locale, "common.navigation.platform_subscriptions"),
          href: `/${locale}/app/platform/subscriptions`,
          icon: Coins,
          permission: "platform.subscriptions.view",
        },
        {
          label: t(locale, "common.navigation.platform_usage"),
          href: `/${locale}/app/platform/usage`,
          icon: Gauge,
          permission: "platform.usage.view",
        },
        {
          label: t(locale, "common.navigation.platform_features"),
          href: `/${locale}/app/platform/features`,
          icon: ToggleRight,
          permission: "platform.features.view",
        },
      ],
    },
    {
      label: t(locale, "common.navigation.platform_governance"),
      items: [
        {
          label: t(locale, "common.navigation.platform_security"),
          href: `/${locale}/app/platform/security`,
          icon: ShieldAlert,
          permission: "platform.security.view",
        },
        {
          label: t(locale, "common.navigation.platform_support"),
          href: `/${locale}/app/platform/support`,
          icon: LifeBuoy,
          permission: "platform.support.view",
        },
        {
          label: t(locale, "common.navigation.platform_data"),
          href: `/${locale}/app/platform/data`,
          icon: Database,
          permission: "platform.data.view",
        },
        {
          label: t(locale, "common.navigation.platform_audit"),
          href: `/${locale}/app/platform/audit`,
          icon: Activity,
          permission: "platform.audit.view",
        },
        {
          label: t(locale, "common.navigation.platform_settings"),
          href: `/${locale}/app/platform/settings`,
          icon: SlidersHorizontal,
          permission: "platform.settings.view",
        },
      ],
    },
  ];
}

export function Sidebar({
  locale,
  open,
  onClose,
}: {
  locale: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data } = useStageLog();
  const { activeWorkspace, hasPermission } = useWorkspace();
  const security = data.settings.security;
  const roles =
    activeWorkspace?.kind === "organization" ? activeWorkspace.roleKeys : [];
  const groups =
    activeWorkspace?.kind === "platform"
      ? platformGroups(locale)
      : activeWorkspace?.kind !== "organization"
        ? personalGroups(locale)
        : roles.includes("owner") || roles.includes("admin")
          ? organizationGroups(locale)
          : roles.includes("program_manager")
            ? programGroups(locale)
            : roles.includes("teacher")
              ? teachingGroups(locale)
              : roles.includes("supervisor")
                ? supervisionGroups(locale)
                : personalGroups(locale);

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || hasPermission(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const activeGroupLabel =
    visibleGroups.find((group) =>
      group.items.some((item) =>
        item.exact ? pathname === item.href : pathname.startsWith(item.href),
      ),
    )?.label ||
    visibleGroups[0]?.label ||
    "";

  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const storageKey = "practicora:navigation-open-groups:v2";
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const storedGroups = Array.isArray(stored) ? stored.map(String) : [];
      setOpenGroups(
        storedGroups.length
          ? storedGroups
          : activeGroupLabel
            ? [activeGroupLabel]
            : [],
      );
    } catch {
      setOpenGroups(activeGroupLabel ? [activeGroupLabel] : []);
    }
  }, [activeWorkspace?.id, activeGroupLabel, locale]);

  useEffect(() => {
    if (!activeGroupLabel) return;
    setOpenGroups((current) =>
      current.includes(activeGroupLabel)
        ? current
        : [...current, activeGroupLabel],
    );
  }, [activeGroupLabel]);

  function toggleGroup(label: string) {
    setOpenGroups((current) => {
      const next = current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label];
      localStorage.setItem(
        "practicora:navigation-open-groups:v2",
        JSON.stringify(next),
      );
      return next;
    });
  }

  const content = (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-text)]">
      <div className="border-b border-[var(--sidebar-border)] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/${locale}/app`}
            className="inline-flex min-w-0 items-center gap-3 px-1"
            onClick={onClose}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sidebar-active)] text-[var(--sidebar-text)]">
              <Orbit className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold tracking-[-0.02em]">
                {t(locale, "common.brand.name")}
              </span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
                {t(locale, "common.brand.product_label")}
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-[var(--sidebar-muted-strong)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] lg:hidden"
            onClick={onClose}
            aria-label={t(locale, "common.navigation.close_menu")}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher locale={locale} />
        </div>
      </div>

      <nav
        className="no-scrollbar flex-1 overflow-y-auto px-3 py-2.5"
        aria-label={t(locale, "common.navigation.application_navigation")}
      >
        {visibleGroups.map((group) => {
          const expanded = openGroups.includes(group.label);
          const groupContainsActive = group.label === activeGroupLabel;
          return (
            <section key={group.label} className="mb-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={expanded}
                className={cn(
                  "flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.075em] transition-[background-color,color] duration-200",
                  groupContainsActive
                    ? "text-[var(--sidebar-text)]"
                    : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
                )}
              >
                <span className="truncate">{group.label}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 transition-transform duration-200",
                    expanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: expanded ? "auto" : 0,
                  opacity: expanded ? 1 : 0,
                }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pt-0.5 pb-1">
                  {group.items.map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    const protectedPage =
                      activeWorkspace?.kind === "personal" &&
                      isPathProtected(security, item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "relative z-0 flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-semibold transition-[background-color,color,transform,box-shadow] duration-200 hover:z-10 hover:translate-x-0.5 hover:shadow-sm",
                          active
                            ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text)]"
                            : "text-[var(--sidebar-muted-strong)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]",
                        )}
                      >
                        {active ? (
                          <motion.span
                            layoutId="active-nav"
                            className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--sidebar-indicator)]"
                            transition={{ duration: 0.16 }}
                          />
                        ) : null}
                        <Icon className="size-[18px] shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {protectedPage ? (
                          <LockKeyhole
                            className="size-3 shrink-0 text-[var(--sidebar-muted)]"
                            aria-label={t(
                              locale,
                              "common.navigation.protected_page",
                            )}
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </section>
          );
        })}

        {activeWorkspace?.kind === "organization" ||
        activeWorkspace?.kind === "platform" ? (
          <div className="mt-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-panel)] p-3 text-[11px] leading-5 text-[var(--sidebar-muted-strong)]">
            <div className="flex items-center gap-2 font-bold text-[var(--sidebar-text)]">
              <ShieldCheck className="size-4" />
              {activeWorkspace.kind === "platform"
                ? t(locale, "common.navigation.platform")
                : t(locale, "common.navigation.role_aware_access")}
            </div>
            <p className="mt-1.5">
              {activeWorkspace.kind === "platform"
                ? t(locale, "common.navigation.platform_access_notice")
                : t(
                    locale,
                    "common.navigation.practicora_only_displays_tools_allowed_by_your_active_membership",
                  )}
            </p>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href={`/${locale}/app/workspaces`}
          className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-semibold text-[var(--sidebar-muted-strong)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
        >
          <Network className="size-4" />
          {t(locale, "common.navigation.all_workspaces")}
        </Link>
        <Link
          href={`/${locale}`}
          className="flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-semibold text-[var(--sidebar-muted-strong)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
        >
          <BookOpenCheck className="size-4" />
          {t(locale, "common.navigation.public_website")}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        {content}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#07131b]/60 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label={t(locale, "common.navigation.close_menu")}
          />
          <motion.aside
            initial={{ x: -290 }}
            animate={{ x: 0 }}
            exit={{ x: -290 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 w-[286px] max-w-[88vw] shadow-2xl"
          >
            {content}
          </motion.aside>
        </div>
      ) : null}
    </>
  );
}
