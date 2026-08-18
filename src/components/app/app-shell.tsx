"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SecurityGate } from "@/components/app/security-gate";
import { AuthBoundary } from "@/components/auth/auth-boundary";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { OnboardingTour } from "@/components/app/onboarding-tour";
import { StageLogProvider, useStageLog } from "@/lib/store";
import { WorkspaceProvider } from "@/lib/workspace";

export function AppShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <AuthBoundary locale={locale}>
      <WorkspaceProvider locale={locale}>
        <StageLogProvider>
          <Shell locale={locale}>{children}</Shell>
        </StageLogProvider>
      </WorkspaceProvider>
    </AuthBoundary>
  );
}

function Shell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  const { data } = useStageLog();

  useEffect(() => {
    document.documentElement.dataset.themePreset = data.settings.themePreset;
    document.documentElement.dataset.density = data.settings.compactMode
      ? "compact"
      : "comfortable";
  }, [data.settings.compactMode, data.settings.themePreset]);
  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        <Sidebar
          locale={locale}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      </AnimatePresence>
      <Topbar locale={locale} onMenu={() => setMenuOpen(true)} />
      <main className="min-h-screen pt-18 lg:pl-[248px]">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </motion.div>
      </main>
      <SecurityGate locale={locale} />
      <OnboardingTour locale={locale} />
    </div>
  );
}
