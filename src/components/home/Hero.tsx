import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HeroConstellation } from "@/components/home/HeroConstellation";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-night pb-20 pt-24 md:pb-28 md:pt-32">
      <div
        className="accent-glow pointer-events-none absolute left-1/2 top-[-12rem] h-[640px] w-[1100px] max-w-none -translate-x-1/2"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex flex-col items-center gap-7 text-center">
        <h1 className="max-w-4xl text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
          {t("headline")}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-neutral-400 md:text-lg">
          {t("subheadline")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/#products" variant="primary">
            {t("ctaPrimary")}
          </Button>
          <Button href="/#free-usage" variant="secondary">
            {t("ctaSecondary")}
          </Button>
        </div>
      </Container>

      <div className="relative z-10 mt-16 md:mt-20">
        <HeroConstellation />
      </div>
    </section>
  );
}
