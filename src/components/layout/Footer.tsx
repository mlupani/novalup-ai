import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { FOOTER_LINKS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-neutral-200 bg-paper">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-ink">Novalup</span>
            <span className="text-accent">AI</span>
          </span>
          <p className="text-sm text-neutral-500">{t("partOf")}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-ink"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
