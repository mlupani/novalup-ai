"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
      aria-label={`Switch to ${nextLocale === "es" ? t("localeEs") : t("localeEn")}`}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
