import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  meta?: string;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const classes = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  }[tone];

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="grid h-full min-h-[142px] grid-cols-[minmax(0,1fr)_auto] gap-4 p-4 sm:p-5">
        <div className="min-w-0 self-center">
          <div className="text-[11px] font-extrabold uppercase leading-4 tracking-[0.1em] text-muted sm:text-xs">
            {label}
          </div>
          <div className="mt-2 text-[clamp(1.55rem,2.4vw,2.35rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-foreground tabular-nums [overflow-wrap:anywhere]">
            {value}
          </div>
          {meta ? <div className="mt-2 text-sm leading-5 text-muted tabular-nums">{meta}</div> : null}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${classes}`}>
          <Icon className="size-5" strokeWidth={1.9} aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}
