import { translate as t } from "@/i18n";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, locale = "fr" }: { status: string; locale?: string }) {
  const key = status.toLowerCase();
  const label: Record<string, string> = {
    active: t(locale, "common.misc.active"),
    planned: t(locale, "common.misc.planned"),
    invited: t(locale, "common.misc.invited"),
    pending: t(locale, "common.misc.pending"),
    draft: t(locale, "common.misc.draft"),
    submitted: t(locale, "common.misc.submitted"),
    in_review: t(locale, "common.misc.in_review"),
    changes_requested: t(locale, "common.misc.changes_requested"),
    approved: t(locale, "common.misc.approved"),
    rejected: t(locale, "common.misc.rejected"),
    completed: t(locale, "common.misc.completed"),
    suspended: t(locale, "common.misc.suspended"),
    expired: t(locale, "common.misc.expired"),
    cancelled: t(locale, "common.misc.cancelled"),
  };
  const style = key === "approved" || key === "completed" || key === "active"
    ? "bg-success/10 text-success"
    : key === "rejected" || key === "suspended" || key === "cancelled"
      ? "bg-danger/10 text-danger"
      : key === "submitted" || key === "in_review" || key === "pending" || key === "invited"
        ? "bg-warning/10 text-warning"
        : "bg-surface-muted text-muted-strong";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold", style)}>{label[key] || status}</span>;
}
