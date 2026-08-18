import type { CountryCode, CurrencyCode, DateFormat, ThemePreset } from "@/lib/types";
import { translate as t } from "@/i18n";

export const THEME_PRESETS: Array<{
  value: ThemePreset;
  swatch: string;
}> = [
  { value: "ocean", swatch: "#2f6f9f" },
  { value: "slate", swatch: "#526579" },
  { value: "forest", swatch: "#39745b" },
  { value: "plum", swatch: "#76558f" },
  { value: "sunrise", swatch: "#b86639" },
];

export function themePresetOptions(locale: string) {
  return THEME_PRESETS.map((preset) => ({
    value: preset.value,
    label: t(locale, `app.settings.theme_${preset.value}`),
  }));
}

export function currencyOptions(locale: string): Array<{ value: CurrencyCode; label: string }> {
  return ["CAD", "USD", "EUR", "GBP", "XAF", "CHF", "JPY"].map((value) => ({
    value: value as CurrencyCode,
    label: `${value} — ${t(locale, `app.settings.currency_${value.toLowerCase()}`)}`,
  }));
}

export function countryOptions(locale: string): Array<{ value: CountryCode; label: string }> {
  return ["CA", "US", "FR", "CM"].map((value) => ({
    value: value as CountryCode,
    label: t(locale, `app.settings.country_${value.toLowerCase()}`),
  }));
}

export function regionOptions(locale: string, country: CountryCode) {
  const options: Record<CountryCode, Array<{ value: string; key: string }>> = {
    CA: [
      { value: "QC", key: "region_qc" },
      { value: "ON", key: "region_on" },
      { value: "BC", key: "region_bc" },
      { value: "AB", key: "region_ab" },
      { value: "NS", key: "region_ns" },
      { value: "NB", key: "region_nb" },
    ],
    US: [
      { value: "US", key: "region_us_federal" },
      { value: "NY", key: "region_ny" },
      { value: "CA", key: "region_california" },
      { value: "TX", key: "region_tx" },
    ],
    FR: [{ value: "FR", key: "region_france" }],
    CM: [{ value: "CM", key: "region_cameroon" }],
  };
  return options[country].map((option) => ({
    value: option.value,
    label: t(locale, `app.settings.${option.key}`),
  }));
}

export function dateFormatOptions(locale: string): Array<{ value: DateFormat; label: string }> {
  return [
    { value: "yyyy-MM-dd", label: t(locale, "app.settings.date_format_iso") },
    { value: "dd/MM/yyyy", label: t(locale, "app.settings.date_format_day_first") },
    { value: "MM/dd/yyyy", label: t(locale, "app.settings.date_format_month_first") },
  ];
}

export function timezoneOptions(locale: string) {
  return [
    { value: "America/Toronto", label: t(locale, "common.misc.timezone_toronto_montreal") },
    { value: "America/Vancouver", label: t(locale, "common.misc.timezone_vancouver") },
    { value: "America/Edmonton", label: t(locale, "common.misc.timezone_edmonton_calgary") },
    { value: "America/Winnipeg", label: t(locale, "app.settings.timezone_winnipeg") },
    { value: "America/Halifax", label: t(locale, "common.misc.timezone_halifax") },
    { value: "America/St_Johns", label: t(locale, "app.settings.timezone_st_johns") },
    { value: "America/New_York", label: t(locale, "app.settings.timezone_new_york") },
    { value: "America/Chicago", label: t(locale, "app.settings.timezone_chicago") },
    { value: "America/Denver", label: t(locale, "app.settings.timezone_denver") },
    { value: "America/Los_Angeles", label: t(locale, "app.settings.timezone_los_angeles") },
    { value: "Europe/London", label: t(locale, "app.settings.timezone_london") },
    { value: "Europe/Paris", label: t(locale, "common.misc.timezone_paris") },
    { value: "Europe/Berlin", label: t(locale, "app.settings.timezone_berlin") },
    { value: "Africa/Douala", label: t(locale, "common.misc.timezone_douala") },
    { value: "Africa/Abidjan", label: t(locale, "app.settings.timezone_abidjan") },
    { value: "Asia/Tokyo", label: t(locale, "app.settings.timezone_tokyo") },
    { value: "Asia/Dubai", label: t(locale, "app.settings.timezone_dubai") },
    { value: "Australia/Sydney", label: t(locale, "app.settings.timezone_sydney") },
  ];
}
