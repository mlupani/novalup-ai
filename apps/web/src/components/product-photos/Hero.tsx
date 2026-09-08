import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PRODUCT_PHOTOS_URL } from "@/lib/constants";
import { ComingSoonBadge } from "./ComingSoonBadge";

export function Hero() {
  const t = useTranslations("productPhotos.hero");

  return (
    <section className="relative overflow-hidden bg-night pb-20 pt-24 md:pb-28 md:pt-32">
      <div
        className="accent-glow pointer-events-none absolute right-[-12%] top-0 h-[520px] w-[760px] max-w-none -translate-y-1/4"
        aria-hidden="true"
      />

      <Container className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-16">
        <RevealOnScroll className="flex flex-col items-start gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-light">
            {t("eyebrow")}
          </span>
          <ComingSoonBadge />
          <h1 className="text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            {t("headline")}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-neutral-400 md:text-lg">
            {t("subheadline")}
          </p>
          <div className="mt-2 flex flex-col items-start gap-3">
            <Button href={PRODUCT_PHOTOS_URL} variant="primary">
              {t("cta")}
            </Button>
            <span className="text-sm text-neutral-500">{t("note")}</span>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120}>
          <figure className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-night-card shadow-[0_50px_120px_-50px_rgba(0,0,0,1)]">
            <div className="relative aspect-square w-full">
              <Image
                src="/images/product-photos/after.jpg"
                alt={t("afterLabel")}
                fill
                priority
                sizes="(min-width: 1024px) 520px, 90vw"
                className="object-cover"
              />
            </div>

            <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-night/85 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              <Sparkles size={10} className="text-accent-light" />
              {t("afterLabel")}
            </span>

            <figcaption className="absolute bottom-3 left-3 flex items-end gap-2">
              <span className="relative h-16 w-24 overflow-hidden rounded-lg border-2 border-white/70 bg-night-card shadow-lg">
                <Image
                  src="/images/product-photos/before.jpg"
                  alt={t("beforeLabel")}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </span>
              <span className="rounded-full bg-night/85 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                {t("beforeLabel")}
              </span>
            </figcaption>
          </figure>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
