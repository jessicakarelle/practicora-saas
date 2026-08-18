import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "border-primary bg-primary text-white hover:border-primary-strong hover:bg-primary-strong",
  secondary:
    "border-border bg-surface text-foreground hover:border-primary/45 hover:bg-primary-softer",
  ghost:
    "border-transparent bg-transparent text-muted-strong hover:bg-surface-muted hover:text-foreground",
  danger: "border-danger/20 bg-danger/8 text-danger hover:bg-danger/14",
  success: "border-success bg-success text-white hover:brightness-95",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
} as const;

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
};

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = Common & {
  href: string;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold leading-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:opacity-55 [&>svg]:shrink-0",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold leading-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/12 [&>svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
