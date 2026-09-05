"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const nextLocale = locale === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
      aria-label={`Switch to ${nextLocale === "es" ? "Español" : "English"}`}
    >
      {nextLocale.toUpperCase()}
    </button>
  );
}
