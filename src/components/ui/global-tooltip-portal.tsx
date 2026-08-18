"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TooltipState = { text: string; left: number; top: number } | null;

export function GlobalTooltipPortal() {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function targetFromEvent(event: Event) {
      const node = event.target;
      return node instanceof Element ? node.closest<HTMLElement>("[data-tooltip]") : null;
    }
    function show(event: Event) {
      const target = targetFromEvent(event);
      const text = target?.dataset.tooltip?.trim();
      if (!target || !text) return;
      const rect = target.getBoundingClientRect();
      const preferredTop = rect.top - 10;
      setTooltip({
        text,
        left: Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2)),
        top: preferredTop > 56 ? preferredTop : rect.bottom + 10,
      });
    }
    function hide(event?: Event) {
      if (event?.type === "mouseout" || event?.type === "focusout") {
        const related = (event as MouseEvent).relatedTarget;
        const current = targetFromEvent(event);
        if (current && related instanceof Node && current.contains(related)) return;
      }
      setTooltip(null);
    }
    document.addEventListener("mouseover", show, true);
    document.addEventListener("focusin", show, true);
    document.addEventListener("mouseout", hide, true);
    document.addEventListener("focusout", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("mouseover", show, true);
      document.removeEventListener("focusin", show, true);
      document.removeEventListener("mouseout", hide, true);
      document.removeEventListener("focusout", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  if (!mounted || !tooltip) return null;
  const above = tooltip.top > 56;
  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[2147483000] max-w-[min(300px,calc(100vw-32px))] rounded-xl border border-white/10 bg-[#101820]/96 px-3 py-2 text-center text-xs font-semibold leading-5 text-white shadow-2xl backdrop-blur-sm"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
    >
      {tooltip.text}
    </div>,
    document.body,
  );
}
