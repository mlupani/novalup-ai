import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { FOOTER_LINKS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/[0.06] bg-night">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Novalup</span>
            <span className="text-accent-light">AI</span>
          </span>
          <p className="text-sm text-neutral-400">{t("partOf")}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => {
            const linkClassName =
              "text-sm font-medium text-neutral-400 transition-colors hover:text-white";

            if (link.href.startsWith("http")) {
              return (
                <a
                  key={link.key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {t(link.key)}
                </a>
              );
            }

            return (
              <Link key={link.key} href={link.href} className={linkClassName}>
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
      </Container>
    </footer>
  );
}
