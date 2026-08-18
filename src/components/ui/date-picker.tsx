"use client";

import { translate as t } from "@/i18n";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const VIEWPORT_PADDING = 12;
const PANEL_GAP = 7;
const PANEL_WIDTH = 326;

type FloatingPosition = {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  min?: string;
  max?: string;
};

function parseDateValue(value: string) {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateAtNoon(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

export function DatePicker({
  id,
  value,
  onChange,
  locale = "fr",
  placeholder,
  ariaLabel,
  disabled = false,
  allowClear = true,
  className,
  min,
  max,
}: DatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const positionFrameRef = useRef<number | null>(null);
  const selectedDate = dateAtNoon(value);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<Date>(() => selectedDate || new Date());
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const reducedMotion = useReducedMotion();
  const resolvedLocale = t(locale, "common.date-picker.en_ca");

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [cursor]);

  const weekLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1, 12);
    return Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(resolvedLocale, { weekday: "short" })
        .format(addDays(monday, index))
        .replace(".", ""),
    );
  }, [resolvedLocale]);

  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(resolvedLocale, { day: "numeric", month: "long", year: "numeric" }).format(selectedDate)
    : placeholder || (t(locale, "common.date-picker.choose_a_date"));

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
    const roomBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const roomAbove = rect.top - VIEWPORT_PADDING;
    const placement = roomBelow < 300 && roomAbove > roomBelow ? "top" : "bottom";
    const availableHeight = (placement === "bottom" ? roomBelow : roomAbove) - PANEL_GAP;
    const maxHeight = Math.max(180, Math.min(440, availableHeight));
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
    );
    setPosition(
      placement === "bottom"
        ? { left, top: rect.bottom + PANEL_GAP, width, maxHeight, placement }
        : { left, bottom: window.innerHeight - rect.top + PANEL_GAP, width, maxHeight, placement },
    );
  }, []);

  const schedulePositionUpdate = useCallback(() => {
    if (positionFrameRef.current !== null) return;
    positionFrameRef.current = window.requestAnimationFrame(() => {
      positionFrameRef.current = null;
      calculatePosition();
    });
  }, [calculatePosition]);

  const close = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  function selectDate(day: Date) {
    const next = toDateValue(day);
    if ((min && next < min) || (max && next > max)) return;
    onChange(next);
    close({ restoreFocus: true });
  }

  useLayoutEffect(() => {
    if (open) calculatePosition();
  }, [calculatePosition, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close({ restoreFocus: true });
    };
    const onResize = () => schedulePositionUpdate();
    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      schedulePositionUpdate();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [close, open, schedulePositionUpdate]);

  const panel =
    typeof document !== "undefined" && position
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="false"
                aria-label={ariaLabel || (t(locale, "common.date-picker.date_picker"))}
                initial={reducedMotion ? false : { opacity: 0, y: position.placement === "bottom" ? -4 : 4, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: position.placement === "bottom" ? -3 : 3, scale: 0.995 }}
                transition={{ duration: reducedMotion ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="practicora-scroll fixed z-[130] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-float)]"
                style={{
                  left: position.left,
                  top: position.top,
                  bottom: position.bottom,
                  width: position.width,
                  maxHeight: position.maxHeight,
                  WebkitOverflowScrolling: "touch",
                  touchAction: "pan-y",
                }}
                onWheelCapture={(event) => event.stopPropagation()}
                onTouchMoveCapture={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-xl text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                    onClick={() => setCursor((month) => subMonths(month, 1))}
                    aria-label={t(locale, "common.date-picker.previous_month")}
                  >
                    <ChevronLeft className="size-4.5" />
                  </button>
                  <div className="text-center text-sm font-extrabold capitalize text-foreground">
                    {new Intl.DateTimeFormat(resolvedLocale, { month: "long", year: "numeric" }).format(cursor)}
                  </div>
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-xl text-muted-strong transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                    onClick={() => setCursor((month) => addMonths(month, 1))}
                    aria-label={t(locale, "common.date-picker.next_month")}
                  >
                    <ChevronRight className="size-4.5" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                  {weekLabels.map((label) => (
                    <div key={label} className="py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
                      {label}
                    </div>
                  ))}
                  {days.map((day) => {
                    const dayValue = toDateValue(day);
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const today = isSameDay(day, new Date());
                    const outside = !isSameMonth(day, cursor);
                    const unavailable = (min ? dayValue < min : false) || (max ? dayValue > max : false);
                    return (
                      <button
                        key={dayValue}
                        type="button"
                        disabled={unavailable}
                        onClick={() => selectDate(day)}
                        className={cn(
                          "relative flex aspect-square min-h-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15",
                          outside ? "text-muted/45" : "text-muted-strong",
                          !selected && !unavailable && "hover:bg-primary-softer hover:text-primary-strong",
                          today && !selected && "font-extrabold text-primary",
                          selected && "bg-primary text-white shadow-sm",
                          unavailable && "cursor-not-allowed opacity-25",
                        )}
                        aria-label={new Intl.DateTimeFormat(resolvedLocale, { dateStyle: "full" }).format(day)}
                        aria-pressed={selected}
                      >
                        {day.getDate()}
                        {today && !selected ? <span className="absolute bottom-1 size-1 rounded-full bg-primary" /> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary-softer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                    onClick={() => selectDate(new Date())}
                  >
                    {t(locale, "common.date-picker.today")}
                  </button>
                  {allowClear && value ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                      onClick={() => {
                        onChange("");
                        close({ restoreFocus: true });
                      }}
                    >
                      <X className="size-3.5" />{t(locale, "common.date-picker.clear")}
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          if (open) close();
          else {
            setCursor(selectedDate || new Date());
            setOpen(true);
          }
        }}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-border bg-surface py-1.5 pr-2 pl-3.5 text-left text-[15px] shadow-[0_1px_1px_rgba(20,45,64,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong hover:bg-surface-muted/35 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/8 disabled:cursor-not-allowed disabled:opacity-55",
          open && "border-primary/65 ring-2 ring-primary/8",
          className,
        )}
      >
        <CalendarDays className="size-4.5 shrink-0 text-muted" aria-hidden />
        <span className={cn("min-w-0 flex-1 truncate", !selectedDate && "text-muted")}>{displayValue}</span>
        <span className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted" aria-hidden>
          <ChevronDown className={cn("size-4 transition-transform duration-150", open && "rotate-180 text-primary")} />
        </span>
      </button>
      {panel}
    </>
  );
}
