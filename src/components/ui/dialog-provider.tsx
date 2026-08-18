"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { translate as t } from "@/i18n";

type DialogTone = "info" | "success" | "warning" | "danger";

type DialogRequest = {
  id: number;
  kind: "alert" | "confirm" | "validation";
  title: string;
  description?: string;
  details?: string[];
  tone: DialogTone;
  confirmLabel: string;
  cancelLabel?: string;
  resolve: (value: boolean) => void;
};

type BaseDialogOptions = {
  title: string;
  description?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogContextValue = {
  alert: (options: BaseDialogOptions) => Promise<void>;
  confirm: (options: BaseDialogOptions) => Promise<boolean>;
  validation: (options: BaseDialogOptions & { details: string[] }) => Promise<void>;
};

const DialogContext = createContext<DialogContextValue | null>(null);
let nextDialogId = 1;

export function DialogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "en" ? "en" : "fr";
  const [request, setRequest] = useState<DialogRequest | null>(null);

  const enqueue = useCallback(
    (
      kind: DialogRequest["kind"],
      options: BaseDialogOptions & { details?: string[] },
    ) =>
      new Promise<boolean>((resolve) => {
        setRequest({
          id: nextDialogId++,
          kind,
          title: options.title,
          description: options.description,
          details: options.details,
          tone: options.tone || (kind === "validation" ? "warning" : "info"),
          confirmLabel: options.confirmLabel || t(locale, "common.dialog.okay"),
          cancelLabel: options.cancelLabel || t(locale, "common.dialog.cancel"),
          resolve,
        });
      }),
    [locale],
  );

  const value = useMemo<DialogContextValue>(
    () => ({
      alert: async (options) => {
        await enqueue("alert", options);
      },
      confirm: (options) => enqueue("confirm", options),
      validation: async (options) => {
        await enqueue("validation", options);
      },
    }),
    [enqueue],
  );

  const close = useCallback(
    (answer: boolean) => {
      setRequest((current) => {
        current?.resolve(answer);
        return null;
      });
    },
    [],
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogViewport request={request} onClose={close} locale={locale} />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error("useDialog must be used inside DialogProvider");
  return value;
}

function DialogViewport({
  request,
  onClose,
  locale,
}: {
  request: DialogRequest | null;
  onClose: (answer: boolean) => void;
  locale: string;
}) {
  const reducedMotion = useReducedMotion();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, request]);

  if (typeof document === "undefined") return null;

  const toneStyles = {
    info: "bg-primary-softer text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  } as const;
  const ToneIcon = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: ShieldAlert,
  }[request?.tone || "info"];

  return createPortal(
    <AnimatePresence>
      {request ? (
        <motion.div
          className="practicora-scroll fixed inset-0 z-[500] flex items-end justify-center overflow-y-auto overscroll-contain bg-[#07131b]/58 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && request.kind !== "validation") onClose(false);
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`dialog-title-${request.id}`}
            aria-describedby={request.description ? `dialog-description-${request.id}` : undefined}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 7, scale: 0.99 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[410px] flex-col overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-float)] sm:max-h-[calc(100dvh-3rem)]"
          >
            <div className="practicora-scroll min-h-0 overflow-y-auto overscroll-contain p-4.5 sm:p-5">
              <div className="flex items-start gap-4">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", toneStyles[request.tone])}>
                <ToneIcon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`dialog-title-${request.id}`} className="text-[17px] font-extrabold tracking-[-0.025em] text-foreground">
                  {request.title}
                </h2>
                {request.description ? (
                  <p id={`dialog-description-${request.id}`} className="mt-1.5 text-sm leading-5.5 text-muted-strong">
                    {request.description}
                  </p>
                ) : null}
                {request.details?.length ? (
                  <ul className="mt-3 space-y-1.5 rounded-xl border border-border bg-background p-3">
                    {request.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-[13px] leading-5 text-muted-strong">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                onClick={() => onClose(false)}
                aria-label={t(locale, "common.dialog.close")}
              >
                <X className="size-4.5" />
              </button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-surface-muted/38 px-4.5 py-3.5 sm:flex-row sm:justify-end sm:px-5">
              {request.kind === "confirm" ? (
                <Button size="sm" variant="secondary" onClick={() => onClose(false)}>
                  {request.cancelLabel}
                </Button>
              ) : null}
              <Button
                ref={confirmRef}
                variant={request.tone === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={() => onClose(true)}
              >
                {request.confirmLabel}
              </Button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
