import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function AppTooltip({ label, className, ...props }: HTMLAttributes<HTMLSpanElement> & { label: string }) {
  return (
    <span
      className={cn("p-tooltip inline-flex", className)}
      data-tooltip={label}
      {...props}
    />
  );
}
