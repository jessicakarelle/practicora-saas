import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, localeDirection } from "@/i18n";
import { PracticoraGuide } from "@/components/assistant/practicora-guide";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { LocaleDocumentSync } from "@/components/i18n/locale-document-sync";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        "fr-CA": `${base}/fr`,
        "en-CA": `${base}/en`,
        es: `${base}/es`,
        pt: `${base}/pt`,
        de: `${base}/de`,
        it: `${base}/it`,
        ar: `${base}/ar`,
        "x-default": `${base}/fr`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div lang={locale} dir={localeDirection(locale)}>
      <LocaleDocumentSync locale={locale} />
      {children}
      <CookieConsent locale={locale} />
      <PracticoraGuide locale={locale} />
    </div>
  );
}
