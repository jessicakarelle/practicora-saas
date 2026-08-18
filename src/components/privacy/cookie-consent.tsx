"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { translate as t } from "@/i18n";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/privacy/cookie-settings-link";

const STORAGE_KEY = "practicora.cookie-consent.v1";
const CONSENT_VERSION = "2026-07-17";

type OptionalConsent = {
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = OptionalConsent & {
  necessary: true;
  version: string;
  updatedAt: string;
};

const EMPTY_OPTIONAL: OptionalConsent = {
  preferences: false,
  analytics: false,
  marketing: false,
};

function readConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.version !== CONSENT_VERSION || parsed.necessary !== true) return null;
    return {
      necessary: true,
      preferences: Boolean(parsed.preferences),
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      version: CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveConsent(value: OptionalConsent) {
  const stored: StoredConsent = {
    necessary: true,
    ...value,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent("practicora:cookie-consent-changed", { detail: stored }));
}

export function CookieConsent({ locale }: { locale: string }) {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState<OptionalConsent>(EMPTY_OPTIONAL);

  useEffect(() => {
    setMounted(true);
    const current = readConsent();
    if (current) {
      setChoices({
        preferences: current.preferences,
        analytics: current.analytics,
        marketing: current.marketing,
      });
    } else {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const open = () => {
      const current = readConsent();
      setChoices(
        current
          ? {
              preferences: current.preferences,
              analytics: current.analytics,
              marketing: current.marketing,
            }
          : EMPTY_OPTIONAL,
      );
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  const close = useCallback(() => {
    if (readConsent()) {
      setVisible(false);
      setCustomizing(false);
    }
  }, []);

  const commit = useCallback((next: OptionalConsent) => {
    saveConsent(next);
    setChoices(next);
    setVisible(false);
    setCustomizing(false);
  }, []);

  const rows = useMemo(
    () => [
      {
        key: "preferences" as const,
        title: t(locale, "marketing.cookies.preferences_title"),
        description: t(locale, "marketing.cookies.preferences_short"),
      },
      {
        key: "analytics" as const,
        title: t(locale, "marketing.cookies.analytics_title"),
        description: t(locale, "marketing.cookies.analytics_short"),
      },
      {
        key: "marketing" as const,
        title: t(locale, "marketing.cookies.marketing_title"),
        description: t(locale, "marketing.cookies.marketing_short"),
      },
    ],
    [locale],
  );

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[900] p-3 sm:p-5"
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <section
            role="dialog"
            aria-modal={customizing ? "true" : undefined}
            aria-labelledby="practicora-cookie-title"
            className="mx-auto w-full max-w-[980px] overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--shadow-float)]"
          >
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                <Cookie className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="practicora-cookie-title" className="text-base font-extrabold text-foreground sm:text-lg">
                  {t(locale, "marketing.cookies.banner_title")}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-strong">
                  {t(locale, "marketing.cookies.banner_description")}
                </p>
              </div>
              {readConsent() ? (
                <button
                  type="button"
                  onClick={close}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                  aria-label={t(locale, "marketing.cookies.close")}
                >
                  <X className="size-4.5" aria-hidden />
                </button>
              ) : null}
            </div>

            {customizing ? (
              <div className="border-t border-border px-4 py-4 sm:px-5">
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                      <ShieldCheck className="size-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{t(locale, "marketing.cookies.necessary_title")}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted">{t(locale, "marketing.cookies.necessary_description")}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-success">{t(locale, "marketing.cookies.always_active")}</span>
                  </div>

                  {rows.map((row) => (
                    <div key={row.key} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{row.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-muted">{row.description}</p>
                      </div>
                      <Switch
                        checked={choices[row.key]}
                        onCheckedChange={(checked) => setChoices((current) => ({ ...current, [row.key]: checked }))}
                        ariaLabel={row.title}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border bg-background/70 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
              <ButtonLink href={`/${locale}/cookies`} variant="ghost" size="sm" className="sm:me-auto">
                {t(locale, "marketing.cookies.learn_more")}
              </ButtonLink>
              <Button variant="ghost" size="sm" onClick={() => commit(EMPTY_OPTIONAL)}>
                {t(locale, "marketing.cookies.reject_optional")}
              </Button>
              {customizing ? (
                <Button variant="secondary" size="sm" onClick={() => commit(choices)}>
                  {t(locale, "marketing.cookies.save_choices")}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setCustomizing(true)}>
                  {t(locale, "marketing.cookies.customize")}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => commit({ preferences: true, analytics: true, marketing: true })}
              >
                {t(locale, "marketing.cookies.accept_all")}
              </Button>
            </div>
          </section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
