import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="bg-night py-24 md:py-28">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
            {t("body")}
          </p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
