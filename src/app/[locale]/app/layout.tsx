import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { translate as t } from "@/i18n";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { default: t(locale, "common.brand.workspace_title"), template: `%s | ${BRAND.name}` },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AppShell locale={locale}>{children}</AppShell>;
}
