import Link from "next/link";
import { translate as t } from "@/i18n";
import { Orbit } from "lucide-react";

export function Brand({ locale = "fr", inverted = false }: { locale?: string; inverted?: boolean }) {
  return (
    <Link href={`/${locale}`} className="inline-flex items-center gap-3" aria-label={t(locale, "common.brand.home_aria_label")}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
        <Orbit className="size-5" aria-hidden />
      </span>
      <span className={inverted ? "text-white" : "text-foreground"}>
        <span className="block text-[15px] font-extrabold tracking-[-0.02em]">{t(locale, "common.brand.name")}</span>
        <span className={inverted ? "block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45" : "block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"}>
          {t(locale, "common.brand.product_label")}
        </span>
      </span>
    </Link>
  );
}
