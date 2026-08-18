import { cn } from "@/lib/utils";

export function StatusPill({ label, status }: { label: string; status: string }) {
  const tone =
    status === "active" || status === "completed" || status === "verified"
      ? "bg-success/10 text-success"
      : status === "suspended" || status === "failed" || status === "past_due"
        ? "bg-danger/10 text-danger"
        : status === "restricted" || status === "queued" || status === "processing" || status === "trialing"
          ? "bg-warning/10 text-warning"
          : "bg-surface-muted text-muted-strong";
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold", tone)}>{label}</span>;
}
