"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { DialogProvider } from "@/components/ui/dialog-provider";
import { GlobalTooltipPortal } from "@/components/ui/global-tooltip-portal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DialogProvider>
        {children}
        <GlobalTooltipPortal />
        <Toaster richColors closeButton position="bottom-right" />
      </DialogProvider>
    </ThemeProvider>
  );
}
