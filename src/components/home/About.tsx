import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="bg-paper py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-600">{t("body")}</p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
