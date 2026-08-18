"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { translate as t } from "@/i18n";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Textarea } from "@/components/ui/field";

export function ActionReasonDialog({
  locale,
  open,
  title,
  description,
  confirmLabel,
  tone = "danger",
  busy = false,
  onClose,
  onConfirm,
}: {
  locale: string;
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const reducedMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setTouched(false);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 80);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
      document.removeEventListener("keydown", key);
    };
  }, [busy, onClose, open]);

  if (typeof document === "undefined") return null;
  const valid = reason.trim().length >= 10;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[520] flex items-end justify-center overflow-y-auto bg-[#07131b]/62 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            className="w-full max-w-lg overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-float)]"
          >
            <div className="flex items-start gap-4 p-5 sm:p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <AlertTriangle className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold tracking-[-0.02em]">{title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-strong">{description}</p>
              </div>
              <button type="button" onClick={onClose} disabled={busy} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-foreground" aria-label={t(locale, "common.dialog.close")}>
                <X className="size-4.5" />
              </button>
            </div>
            <div className="border-t border-border px-5 py-4 sm:px-6">
              <FieldLabel>{t(locale, "common.dialog.reason_label")}</FieldLabel>
              <Textarea ref={textareaRef} value={reason} onChange={(event) => setReason(event.target.value)} onBlur={() => setTouched(true)} placeholder={t(locale, "common.dialog.reason_placeholder")} className="min-h-28" />
              <FieldError>{touched && !valid ? t(locale, "common.dialog.reason_minimum") : undefined}</FieldError>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <Button variant="secondary" onClick={onClose} disabled={busy}>{t(locale, "common.dialog.cancel")}</Button>
              <Button
                variant={tone === "danger" ? "danger" : "primary"}
                disabled={busy || !valid}
                onClick={() => {
                  setTouched(true);
                  if (valid) void onConfirm(reason.trim());
                }}
              >
                {busy ? t(locale, "common.navigation.saving") : confirmLabel}
              </Button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
