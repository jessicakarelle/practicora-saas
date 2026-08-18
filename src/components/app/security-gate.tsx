"use client";

import { translate as t } from "@/i18n";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Delete, LockKeyhole, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  getProtectedSectionFromPath,
  getSecurityBlockedUntil,
  getSecurityFailedAttempts,
  getSecurityLastActivity,
  hashPin,
  isManualSecurityLock,
  isPathProtected,
  markSecurityUnlocked,
  SECURITY_ACTIVITY_EVENT,
  SECURITY_LOCK_EVENT,
  setManualSecurityLock,
  setSecurityBlockedUntil,
  setSecurityFailedAttempts,
  touchSecurityActivity,
} from "@/lib/security";
import { usePracticora } from "@/lib/store";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 5 * 60 * 1000;

export function SecurityGate({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const fr = locale !== "en";
  const reducedMotion = useReducedMotion();
  const { data, ready } = usePracticora();
  const security = data.settings.security;
  const section = useMemo(() => getProtectedSectionFromPath(pathname), [pathname]);
  const protectedRoute = useMemo(() => isPathProtected(security, pathname), [pathname, security]);
  const [locked, setLocked] = useState(false);
  const [manualLock, setManualLock] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(0);
  const lastTouchRef = useRef(0);

  const evaluateLock = useCallback(() => {
    if (!ready || !security.enabled || !security.pinHash) {
      setLocked(false);
      setManualLock(false);
      return;
    }

    const currentManualLock = isManualSecurityLock();
    const currentBlockedUntil = getSecurityBlockedUntil();
    const currentAttempts = getSecurityFailedAttempts();
    const lastActivity = getSecurityLastActivity();
    const timeoutMs = security.autoLockMinutes >= 9999 ? Number.POSITIVE_INFINITY : security.autoLockMinutes * 60 * 1000;
    const expired = lastActivity > 0 && Date.now() - lastActivity >= timeoutMs;
    const protectedRouteNeedsUnlock = protectedRoute && lastActivity === 0;

    if (expired) setManualSecurityLock(true);

    setBlockedUntil(currentBlockedUntil);
    setAttempts(currentAttempts);
    setManualLock(currentManualLock || expired);
    setLocked(currentManualLock || expired || protectedRouteNeedsUnlock);
  }, [protectedRoute, ready, security]);

  useEffect(() => {
    // Synchronize the gate with sessionStorage after route changes.
    evaluateLock();
  }, [evaluateLock, pathname]);

  useEffect(() => {
    if (!ready || !security.enabled || !security.pinHash) return;

    const onLock = () => {
      setManualLock(true);
      setLocked(true);
      setPin("");
      setError("");
    };
    const onSecurityActivity = () => evaluateLock();
    const onActivity = () => {
      if (locked) return;
      const timestamp = Date.now();
      if (timestamp - lastTouchRef.current < 8000) return;
      lastTouchRef.current = timestamp;
      touchSecurityActivity();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") evaluateLock();
    };

    window.addEventListener(SECURITY_LOCK_EVENT, onLock);
    window.addEventListener(SECURITY_ACTIVITY_EVENT, onSecurityActivity);
    window.addEventListener("pointerdown", onActivity, true);
    window.addEventListener("keydown", onActivity, true);
    window.addEventListener("touchstart", onActivity, true);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      setNow(Date.now());
      evaluateLock();
    }, 1000);

    return () => {
      window.removeEventListener(SECURITY_LOCK_EVENT, onLock);
      window.removeEventListener(SECURITY_ACTIVITY_EVENT, onSecurityActivity);
      window.removeEventListener("pointerdown", onActivity, true);
      window.removeEventListener("keydown", onActivity, true);
      window.removeEventListener("touchstart", onActivity, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [evaluateLock, locked, ready, security.enabled, security.pinHash]);

  useEffect(() => {
    if (!locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);

  const verifyPin = useCallback(async (candidatePin: string) => {
    if (verifying || blockedUntil > Date.now() || candidatePin.length !== security.pinLength) return;

    setVerifying(true);
    try {
      const candidate = await hashPin(candidatePin);
      if (candidate === security.pinHash) {
        markSecurityUnlocked();
        setManualSecurityLock(false);
        setSecurityBlockedUntil(0);
        setSecurityFailedAttempts(0);
        setAttempts(0);
        setBlockedUntil(0);
        setLocked(false);
        setManualLock(false);
        setPin("");
        setError("");
        toast.success(t(locale, "common.security.workspace_unlocked"));
        return;
      }

      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setSecurityFailedAttempts(nextAttempts);
      setPin("");

      if (nextAttempts >= MAX_ATTEMPTS) {
        const nextBlockedUntil = Date.now() + BLOCK_DURATION_MS;
        setBlockedUntil(nextBlockedUntil);
        setSecurityBlockedUntil(nextBlockedUntil);
        setError(t(locale, "common.security.too_many_attempts_access_blocked_for_5_minutes"));
      } else {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setError(t(locale, "common.security.incorrect_code_attempts_remaining", { count: remaining }));
      }
    } finally {
      setVerifying(false);
    }
  }, [attempts, blockedUntil, locale, security.pinHash, security.pinLength, verifying]);

  const appendDigit = useCallback((digit: string) => {
    if (blockedUntil > Date.now() || verifying) return;
    setError("");
    setPin((current) => (current.length >= security.pinLength ? current : `${current}${digit}`));
  }, [blockedUntil, security.pinLength, verifying]);

  useEffect(() => {
    if (!locked || pin.length !== security.pinLength || verifying || blockedUntil > Date.now()) return;
    const timer = window.setTimeout(() => void verifyPin(pin), 120);
    return () => window.clearTimeout(timer);
  }, [blockedUntil, locked, pin, security.pinLength, verifyPin, verifying]);

  useEffect(() => {
    if (!locked) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setPin((current) => current.slice(0, -1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appendDigit, locked]);

  const blockSeconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  const canReturnToDashboard = !manualLock && Boolean(section);

  return (
    <AnimatePresence>
      {ready && security.enabled && security.pinHash && locked ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="practicora-lock-title"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.16 }}
          className="fixed inset-0 z-[200] flex min-h-dvh items-center justify-center overflow-y-auto bg-[#091721]/74 p-3 backdrop-blur-lg sm:p-5"
        >
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 7, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[350px] rounded-[24px] border border-white/12 bg-surface p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-6"
          >
            <div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary-softer text-primary">
              {blockSeconds > 0 ? <ShieldAlert className="size-5" /> : <LockKeyhole className="size-5" />}
            </div>
            <div className="mt-3 text-center">
              <h2 id="practicora-lock-title" className="text-lg font-extrabold tracking-[-0.025em] text-foreground">
                {blockSeconds > 0
                  ? t(locale, "common.security.access_temporarily_blocked")
                  : t(locale, "common.security.protected_page")}
              </h2>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-5.5 text-muted">
                {blockSeconds > 0
                  ? fr
                    ? `Réessayez dans ${Math.floor(blockSeconds / 60)}:${String(blockSeconds % 60).padStart(2, "0")}.`
                    : `Try again in ${Math.floor(blockSeconds / 60)}:${String(blockSeconds % 60).padStart(2, "0")}.`
                  : t(locale, "common.security.enter_your_pin_validation_is_automatic")}
              </p>
            </div>

            <div className="mt-4 flex justify-center gap-2" aria-label={t(locale, "common.security.entered_pin")}>
              {Array.from({ length: security.pinLength }, (_, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full border transition-colors duration-150 ${
                    index < pin.length ? "border-primary bg-primary" : "border-border-strong bg-surface-muted"
                  }`}
                />
              ))}
            </div>

            <div className="mx-auto mt-4 grid max-w-[224px] grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <PinButton key={digit} onClick={() => appendDigit(digit)} disabled={blockSeconds > 0 || verifying}>
                  {digit}
                </PinButton>
              ))}
              <span aria-hidden />
              <PinButton onClick={() => appendDigit("0")} disabled={blockSeconds > 0 || verifying}>0</PinButton>
              <PinButton onClick={() => setPin((current) => current.slice(0, -1))} disabled={!pin || blockSeconds > 0 || verifying} ariaLabel={t(locale, "common.security.delete_one_digit")}>
                <Delete className="size-4.5" />
              </PinButton>
            </div>

            <div className="mt-4 min-h-5 text-center text-xs font-semibold text-danger" aria-live="polite">
              {verifying ? (t(locale, "common.security.checking")) : error}
            </div>

            {canReturnToDashboard ? (
              <button
                type="button"
                className="mx-auto mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                onClick={() => {
                  setLocked(false);
                  setPin("");
                  router.push(`/${locale}/app`);
                }}
              >
                <ArrowLeft className="size-3.5" />{t(locale, "common.security.back_to_dashboard")}
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function PinButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex aspect-square min-h-12 items-center justify-center rounded-[14px] border border-border bg-background text-base font-extrabold text-foreground transition-[background-color,border-color,transform] duration-100 hover:border-primary/30 hover:bg-primary-softer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
