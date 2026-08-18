import type { Metadata } from "next";
import { translate as t } from "@/i18n";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: t(locale, "auth.reset-password-form.metadata_title"), robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ResetPasswordForm locale={locale} />;
}
