"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { translate as t } from "@/i18n";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "fr";
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  const maxWidth = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          className="fixed inset-0 z-[450] flex items-end justify-center overflow-y-auto bg-[#07131b]/58 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            initial={reduced ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[24px] border border-border bg-surface shadow-[var(--shadow-float)] sm:max-h-[calc(100dvh-3rem)]",
              maxWidth,
            )}
          >
            <header className="flex shrink-0 items-start gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-lg font-extrabold tracking-[-0.03em] text-foreground">{title}</h2>
                {description ? <p id={descriptionId} className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
              </div>
              <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-foreground" aria-label={t(locale, "common.dialog.close")}><X className="size-4.5" /></button>
            </header>
            <div className="practicora-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
            {footer ? <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-surface-muted/35 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</footer> : null}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
