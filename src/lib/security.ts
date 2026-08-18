import type { ProtectedSectionId, SecuritySettings } from "@/lib/types";

export const ALL_PROTECTED_SECTIONS: ProtectedSectionId[] = [
  "dashboard",
  "week",
  "calendar",
  "journal",
  "history",
  "notes",
  "objectives",
  "skills",
  "evaluation",
  "analytics",
  "internships",
  "compensation",
  "reports",
  "account",
  "settings",
  "trash",
];

export const DEFAULT_PROTECTED_SECTIONS: ProtectedSectionId[] = [
  "analytics",
  "compensation",
  "reports",
  "account",
  "settings",
];

export const SECURITY_LOCK_EVENT = "stagelog:security:lock";
export const SECURITY_ACTIVITY_EVENT = "stagelog:security:activity";

const LAST_ACTIVITY_KEY = "stagelog:security:last-activity";
const MANUAL_LOCK_KEY = "stagelog:security:manual-lock";
const BLOCKED_UNTIL_KEY = "stagelog:security:blocked-until";
const FAILED_ATTEMPTS_KEY = "stagelog:security:failed-attempts";
const PIN_SALT = "stagelog-saas-security-v1";

const SECTION_PATHS: Record<ProtectedSectionId, string> = {
  dashboard: "/app",
  week: "/app/week",
  calendar: "/app/calendar",
  journal: "/app/journal/new",
  history: "/app/journal/history",
  notes: "/app/notes",
  objectives: "/app/objectives",
  skills: "/app/skills",
  evaluation: "/app/evaluation",
  analytics: "/app/analytics",
  internships: "/app/internships",
  compensation: "/app/compensation",
  reports: "/app/reports",
  account: "/app/account",
  settings: "/app/settings",
  trash: "/app/trash",
};

export async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(`${PIN_SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeWorkspacePath(pathname: string) {
  const withoutOrigin = pathname.trim().replace(/^https?:\/\/[^/]+/i, "");
  const withoutLocale = withoutOrigin.replace(/^\/(?:fr|en)(?=\/)/i, "");
  const withoutQuery = withoutLocale.split(/[?#]/, 1)[0] || "/app";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/app";
  return normalized;
}

export function normalizeCustomProtectedPath(value: string) {
  const normalized = normalizeWorkspacePath(value);
  if (normalized === "/app") return normalized;
  if (!normalized.startsWith("/app/")) return null;
  if (!/^\/app\/[a-z0-9/_-]+$/i.test(normalized)) return null;
  return normalized;
}

export function getSectionPath(section: ProtectedSectionId) {
  return SECTION_PATHS[section];
}

export function getProtectedSectionFromPath(pathname: string): ProtectedSectionId | null {
  const normalized = normalizeWorkspacePath(pathname);

  if (normalized === "/app/journal/new" || normalized.startsWith("/app/journal/edit/")) {
    return "journal";
  }
  if (normalized === "/app/journal/history" || normalized.startsWith("/app/journal/history/")) {
    return "history";
  }

  const orderedSections = [...ALL_PROTECTED_SECTIONS].sort(
    (left, right) => SECTION_PATHS[right].length - SECTION_PATHS[left].length,
  );

  return (
    orderedSections.find((section) => {
      const route = SECTION_PATHS[section];
      if (section === "dashboard") return normalized === route;
      return normalized === route || normalized.startsWith(`${route}/`);
    }) ?? null
  );
}

export function isSectionProtected(settings: SecuritySettings, section: ProtectedSectionId | null) {
  return Boolean(
    settings.enabled &&
      settings.pinHash &&
      section &&
      settings.protectedSections.includes(section),
  );
}

export function isPathProtected(settings: SecuritySettings, pathname: string) {
  if (!settings.enabled || !settings.pinHash) return false;

  const normalized = normalizeWorkspacePath(pathname);
  const section = getProtectedSectionFromPath(normalized);
  const knownProtected = Boolean(section && settings.protectedSections.includes(section));
  const customProtected = settings.customProtectedPaths.some(
    (path) => normalized === path || normalized.startsWith(`${path}/`),
  );

  return knownProtected || customProtected;
}

export function markSecurityUnlocked() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  sessionStorage.removeItem(MANUAL_LOCK_KEY);
  sessionStorage.removeItem(BLOCKED_UNTIL_KEY);
  sessionStorage.setItem(FAILED_ATTEMPTS_KEY, "0");
  window.dispatchEvent(new Event(SECURITY_ACTIVITY_EVENT));
}

export function touchSecurityActivity() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function getSecurityLastActivity() {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(LAST_ACTIVITY_KEY) || 0);
}

export function setManualSecurityLock(locked: boolean) {
  if (typeof window === "undefined") return;
  if (locked) sessionStorage.setItem(MANUAL_LOCK_KEY, "1");
  else sessionStorage.removeItem(MANUAL_LOCK_KEY);
}

export function isManualSecurityLock() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(MANUAL_LOCK_KEY) === "1";
}

export function requestSecurityLock() {
  if (typeof window === "undefined") return;
  setManualSecurityLock(true);
  window.dispatchEvent(new Event(SECURITY_LOCK_EVENT));
}

export function getSecurityBlockedUntil() {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(BLOCKED_UNTIL_KEY) || 0);
}

export function setSecurityBlockedUntil(timestamp: number) {
  if (typeof window === "undefined") return;
  if (timestamp > 0) sessionStorage.setItem(BLOCKED_UNTIL_KEY, String(timestamp));
  else sessionStorage.removeItem(BLOCKED_UNTIL_KEY);
}

export function getSecurityFailedAttempts() {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(FAILED_ATTEMPTS_KEY) || 0);
}

export function setSecurityFailedAttempts(attempts: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FAILED_ATTEMPTS_KEY, String(Math.max(0, attempts)));
}
