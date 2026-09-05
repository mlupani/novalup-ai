import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroMockups } from "@/components/home/HeroMockups";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-ink pb-20 pt-32 md:pb-32 md:pt-40">
      <Container className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-lg text-neutral-400 md:text-xl">
          {t("subheadline")}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button href="/#products" variant="primary">
            {t("ctaPrimary")}
          </Button>
          <Button href="/#free-usage" variant="secondary-dark">
            {t("ctaSecondary")}
          </Button>
        </div>
      </Container>

      <div className="relative z-10 mt-16 md:mt-20">
        <HeroMockups />
      </div>
    </section>
  );
}
