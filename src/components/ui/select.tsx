"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

type FloatingPosition = {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

type SelectProps = {
  id?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  startIcon?: ReactNode;
};

const VIEWPORT_PADDING = 12;
const PANEL_GAP = 7;

export function Select({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Sélectionner",
  ariaLabel,
  disabled = false,
  className,
  startIcon,
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${id || generatedId}-listbox`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const positionFrameRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const reducedMotion = useReducedMotion();

  const selectedIndex = useMemo(
    () => Math.max(0, options.findIndex((option) => option.value === value)),
    [options, value],
  );
  const selectedOption = options.find((option) => option.value === value);

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(
      Math.max(rect.width, 220),
      Math.max(220, window.innerWidth - VIEWPORT_PADDING * 2),
    );
    const estimatedHeight = Math.min(320, Math.max(96, options.length * 44 + 12));
    const roomBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const roomAbove = rect.top - VIEWPORT_PADDING;
    const placement = roomBelow < Math.min(estimatedHeight, 210) && roomAbove > roomBelow ? "top" : "bottom";
    const maxHeight = Math.max(
      112,
      Math.min(320, (placement === "bottom" ? roomBelow : roomAbove) - PANEL_GAP),
    );
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      Math.max(VIEWPORT_PADDING, window.innerWidth - panelWidth - VIEWPORT_PADDING),
    );

    setPosition(
      placement === "bottom"
        ? { left, top: rect.bottom + PANEL_GAP, width: panelWidth, maxHeight, placement }
        : {
            left,
            bottom: window.innerHeight - rect.top + PANEL_GAP,
            width: panelWidth,
            maxHeight,
            placement,
          },
    );
  }, [options.length]);

  const schedulePositionUpdate = useCallback(() => {
    if (positionFrameRef.current !== null) return;
    positionFrameRef.current = window.requestAnimationFrame(() => {
      positionFrameRef.current = null;
      calculatePosition();
    });
  }, [calculatePosition]);

  function firstEnabledIndex(direction: 1 | -1, from: number) {
    if (!options.length) return 0;
    let index = from;
    for (let attempt = 0; attempt < options.length; attempt += 1) {
      index = (index + direction + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return from;
  }

  function openPanel(preferredIndex = selectedIndex) {
    if (disabled) return;
    const safeIndex = options[preferredIndex]?.disabled
      ? firstEnabledIndex(1, preferredIndex - 1)
      : preferredIndex;
    setActiveIndex(safeIndex);
    setOpen(true);
  }

  const closePanel = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  function choose(option: SelectOption) {
    if (option.disabled) return;
    onValueChange(option.value);
    closePanel({ restoreFocus: true });
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openPanel(selectedIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openPanel(firstEnabledIndex(-1, selectedIndex + 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) closePanel();
      else openPanel(selectedIndex);
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel({ restoreFocus: true });
      return;
    }
    if (event.key === "Tab") {
      closePanel();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => firstEnabledIndex(direction, current));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = options.findIndex((option) => !option.disabled);
      if (first >= 0) setActiveIndex(first);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = [...options].reverse().findIndex((option) => !option.disabled);
      if (last >= 0) setActiveIndex(options.length - 1 - last);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
    }
  }

  useLayoutEffect(() => {
    if (!open) return;
    calculatePosition();
  }, [calculatePosition, open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || panelRef.current?.contains(node)) return;
      closePanel();
    };
    const onResize = () => schedulePositionUpdate();
    const onScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && panelRef.current?.contains(target)) return;
      schedulePositionUpdate();
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [closePanel, open, schedulePositionUpdate]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const panel =
    typeof document !== "undefined" && position
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                ref={panelRef}
                id={listboxId}
                role="listbox"
                aria-label={ariaLabel}
                tabIndex={-1}
                onKeyDown={onPanelKeyDown}
                initial={reducedMotion ? false : { opacity: 0, y: position.placement === "bottom" ? -4 : 4, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: position.placement === "bottom" ? -3 : 3, scale: 0.995 }}
                transition={{ duration: reducedMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="fixed z-[130] overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-float)]"
                style={{
                  left: position.left,
                  top: position.top,
                  bottom: position.bottom,
                  width: position.width,
                }}
              >
                <div
                  className="practicora-scroll overflow-y-auto overscroll-contain pr-0.5"
                  style={{
                    maxHeight: position.maxHeight,
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-y",
                  }}
                  onWheelCapture={(event) => event.stopPropagation()}
                  onTouchMoveCapture={(event) => event.stopPropagation()}
                >
                  {options.map((option, index) => {
                    const selected = option.value === value;
                    const active = index === activeIndex;
                    return (
                      <button
                        key={option.value}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={option.disabled}
                        onPointerMove={() => !option.disabled && setActiveIndex(index)}
                        onClick={() => choose(option)}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-100 focus-visible:outline-none",
                          active ? "bg-primary-softer text-foreground" : "text-muted-strong",
                          selected && "font-semibold text-primary-strong",
                          option.disabled && "cursor-not-allowed opacity-40",
                        )}
                      >
                        {option.icon ? <span className="shrink-0 text-primary">{option.icon}</span> : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{option.label}</span>
                          {option.description ? (
                            <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="flex size-5 shrink-0 items-center justify-center">
                          {selected ? <Check className="size-4 text-primary" aria-hidden /> : null}
                        </span>
                      </button>
                    );
                  })}
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? closePanel() : openPanel(selectedIndex))}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "group flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-border bg-surface py-1.5 pr-2 pl-3.5 text-left text-[15px] text-foreground shadow-[0_1px_1px_rgba(20,45,64,0.02)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-border-strong hover:bg-surface-muted/35 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/8 disabled:cursor-not-allowed disabled:opacity-55",
          open && "border-primary/65 ring-2 ring-primary/8",
          className,
        )}
      >
        {startIcon ? <span className="shrink-0 text-muted">{startIcon}</span> : null}
        <span className={cn("min-w-0 flex-1 truncate", !selectedOption && "text-muted")}> 
          {selectedOption?.label || placeholder}
        </span>
        <span className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors group-hover:text-foreground" aria-hidden>
          <ChevronDown
            className={cn("size-4 transition-transform duration-150", open && "rotate-180 text-primary")}
          />
        </span>
      </button>
      {panel}
    </>
  );
}
