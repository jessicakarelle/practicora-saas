"use client";

import { translate as t } from "@/i18n";

import { forwardRef, useMemo, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground">
      {children}
    </label>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-sm leading-5 text-muted">{children}</p>;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm font-medium text-danger">{children}</p>;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-[15px] text-foreground shadow-[0_1px_1px_rgba(20,45,64,0.02)] placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus-visible:border-primary/65 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/7",
        className,
      )}
      {...props}
    />
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  className,
  showLabel = "Afficher le mot de passe",
  hideLabel = "Masquer le mot de passe",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/12"
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

export function PasswordStrength({ password, locale = "fr" }: { password: string; locale?: string }) {
  const checks = useMemo(
    () => [
      { valid: password.length >= 8, label: t(locale, "common.field.at_least_8_characters") },
      { valid: /[A-Z]/.test(password), label: t(locale, "common.field.one_uppercase_letter") },
      { valid: /[a-z]/.test(password), label: t(locale, "common.field.one_lowercase_letter") },
      { valid: /\d/.test(password), label: t(locale, "common.field.one_number") },
    ],
    [locale, password],
  );
  const score = checks.filter((item) => item.valid).length;
  const label = score <= 1 ? (t(locale, "common.field.weak")) : score <= 3 ? (t(locale, "common.field.fair")) : (t(locale, "common.field.strong"));

  if (!password) return null;

  return (
    <div className="mt-2 rounded-xl border border-border bg-background p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-bold">
        <span className="text-muted-strong">{t(locale, "common.field.strength")}</span>
        <span className={score === 4 ? "text-success" : score >= 2 ? "text-warning" : "text-danger"}>{label}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className={cn("h-1.5 rounded-full", index < score ? (score === 4 ? "bg-success" : score >= 2 ? "bg-warning" : "bg-danger") : "bg-border")} />
        ))}
      </div>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {checks.map((check) => (
          <span key={check.label} className={cn("flex items-center gap-1.5 text-[11px]", check.valid ? "text-success" : "text-muted")}>
            <Check className="size-3" aria-hidden />{check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y overflow-y-auto rounded-xl border border-border bg-surface px-3.5 py-3 text-[15px] leading-6 text-foreground shadow-[0_1px_1px_rgba(20,45,64,0.02)] placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong focus-visible:border-primary/65 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/7",
        className,
      )}
      {...props}
    />
  );
});
