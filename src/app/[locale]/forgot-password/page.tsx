import type { Metadata } from "next";
import { translate as t } from "@/i18n";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "auth.forgot-password-form.metadata_title"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ForgotPasswordForm locale={locale} />;
}
