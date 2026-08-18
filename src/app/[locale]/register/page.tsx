import type { Metadata } from "next";
import { translate as t } from "@/i18n";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "auth.auth-form.register_metadata_title"), robots: { index: false, follow: false } };
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <AuthForm locale={locale} mode="register" />
    </Suspense>
  );
}
