import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section className="bg-ink py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-400">{t("subheading")}</p>
          <Button href="/#products" variant="primary">
            {t("cta")}
          </Button>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
