"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LocaleToggle } from "@/components/layout/LocaleToggle";

export function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const t = useTranslations("nav");

  return (
    <div className="border-t border-neutral-200 bg-paper md:hidden">
      <Container className="flex flex-col gap-6 py-6">
        <nav className="flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={onNavigate}
              className="text-base font-medium text-ink"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between">
          <LocaleToggle />
          <Button href="/#products" variant="primary" onClick={onNavigate}>
            {t("tryTool")}
          </Button>
        </div>
      </Container>
    </div>
  );
}
