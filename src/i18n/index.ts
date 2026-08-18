import { catalogs } from "@/i18n/catalog";

export type SupportedLocale = keyof typeof catalogs;

export const supportedLocales = ["fr", "en", "es", "pt", "de", "it", "ar"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export function isLocale(locale: string): locale is AppLocale {
  return supportedLocales.includes(locale as AppLocale);
}

export type TranslationValues = Record<string, string | number | boolean | null | undefined>;

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  return isLocale(locale || "") ? (locale as AppLocale) : "fr";
}

function interpolate(value: string, values?: TranslationValues) {
  if (!values) return value;
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const replacement = values[key];
    return replacement === null || replacement === undefined ? "" : String(replacement);
  });
}

export function localeDirection(locale: string | null | undefined) {
  return normalizeLocale(locale) === "ar" ? "rtl" : "ltr";
}

export function localeTag(locale: string | null | undefined) {
  const tags: Record<AppLocale, string> = {
    fr: "fr-CA",
    en: "en-CA",
    es: "es",
    pt: "pt",
    de: "de",
    it: "it",
    ar: "ar",
  };
  return tags[normalizeLocale(locale)];
}

export function translate(locale: string | null | undefined, path: string, values?: TranslationValues) {
  const language = normalizeLocale(locale);
  const segments = path.split(".");
  if (segments.length < 2) return path;
  const key = segments.pop()!;
  const namespace = segments.join(".");
  const primary = catalogs[language] as Record<string, Record<string, string>>;
  const english = catalogs.en as Record<string, Record<string, string>>;
  const french = catalogs.fr as Record<string, Record<string, string>>;
  const value = primary[namespace]?.[key] ?? english[namespace]?.[key] ?? french[namespace]?.[key];
  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") console.warn(`Missing translation: ${language}:${path}`);
    return path;
  }
  return interpolate(value, values);
}
