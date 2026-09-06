import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

export function StatementStrip() {
  const t = useTranslations("statement");

  return (
    <section className="border-y border-white/[0.06] bg-night-soft py-9 md:py-11">
      <Container className="flex items-center justify-center gap-6">
        <span className="hairline hidden h-px flex-1 sm:block" aria-hidden="true" />
        <p className="text-center text-sm font-medium tracking-tight text-neutral-400 md:text-base">
          <span className="text-white">{t("strong")}</span> {t("rest")}
        </p>
        <span className="hairline hidden h-px flex-1 sm:block" aria-hidden="true" />
      </Container>
    </section>
  );
}
