import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";
import brandCopy from "@/i18n/locales/fr/common/brand.json";
import metadataCopy from "@/i18n/locales/fr/common/metadata.json";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: brandCopy.root_title,
    template: `%s | ${BRAND.name}`,
  },
  description: brandCopy.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: metadataCopy.metadata_category,
  keywords: metadataCopy.metadata_keywords,
  openGraph: {
    type: "website",
    locale: metadataCopy.open_graph_locale,
    alternateLocale: metadataCopy.alternate_open_graph_locale,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${brandCopy.tagline}`,
    description: brandCopy.description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${brandCopy.tagline}`,
    description: brandCopy.description,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1720" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
