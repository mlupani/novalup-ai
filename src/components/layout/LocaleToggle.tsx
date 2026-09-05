"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

function EsFlag() {
  return (
    <svg viewBox="0 0 3 2" className="h-full w-full" aria-hidden="true">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  );
}

function GbFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden="true">
      <rect width="60" height="30" fill="#00247D" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#CF142B" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#CF142B" strokeWidth="6" />
    </svg>
  );
}

export function LocaleToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("nav");
  const nextLocale = locale === "es" ? "en" : "es";
  const nextLabel = nextLocale === "es" ? t("localeEs") : t("localeEn");

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-neutral-300 transition-colors hover:border-ink"
      aria-label={`Switch to ${nextLabel}`}
      title={nextLabel}
    >
      {nextLocale === "es" ? <EsFlag /> : <GbFlag />}
    </button>
  );
}
