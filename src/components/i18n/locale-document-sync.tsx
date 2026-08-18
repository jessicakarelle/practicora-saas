"use client";

import { useEffect } from "react";
import { localeDirection, localeTag, normalizeLocale } from "@/i18n";

export function LocaleDocumentSync({ locale }: { locale: string }) {
  useEffect(() => {
    const normalized = normalizeLocale(locale);
    const root = document.documentElement;
    root.lang = localeTag(normalized);
    root.dir = localeDirection(normalized);
    root.dataset.locale = normalized;
    return () => {
      delete root.dataset.locale;
    };
  }, [locale]);
  return null;
}
