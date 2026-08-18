"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Switch({ checked, onCheckedChange, disabled = false, ariaLabel, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-45",
        checked ? "border-primary bg-primary" : "border-border-strong bg-surface-strong",
        className,
      )}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-white shadow-sm transition-transform duration-150",
          checked ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
