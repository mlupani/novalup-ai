import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

function ProductSilhouette({ tone }: { tone: "before" | "after" }) {
  const isAfter = tone === "after";

  return (
    <svg viewBox="0 0 120 160" className="h-32 w-24 md:h-40 md:w-32" aria-hidden="true">
      <ellipse
        cx="60"
        cy="150"
        rx="34"
        ry={isAfter ? 8 : 5}
        fill={isAfter ? "url(#shadow-after)" : "#00000022"}
      />
      <rect
        x="30"
        y="40"
        width="60"
        height="100"
        rx="14"
        fill={isAfter ? "url(#bottle-after)" : "#B8B8BC"}
      />
      <rect
        x="45"
        y="18"
        width="30"
        height="26"
        rx="6"
        fill={isAfter ? "#be123c" : "#8A8A8E"}
      />
      {isAfter && (
        <defs>
          <linearGradient id="bottle-after" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <radialGradient id="shadow-after">
            <stop offset="0%" stopColor="#e11d4855" />
            <stop offset="100%" stopColor="#e11d4800" />
          </radialGradient>
        </defs>
      )}
    </svg>
  );
}

export function FeaturedProduct() {
  const t = useTranslations("featuredProduct");

  return (
    <section className="bg-paper-alt py-24 md:py-32">
      <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <RevealOnScroll className="order-2 lg:order-1">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <ol className="mt-8 flex flex-col gap-4">
            {(["step1", "step2", "step3"] as const).map((key, index) => (
              <li key={key} className="flex items-start gap-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="pt-1 text-base text-neutral-600">{t(key)}</p>
              </li>
            ))}
          </ol>
          <Button href="/product-photos" variant="primary" className="mt-10">
            {t("cta")}
          </Button>
        </RevealOnScroll>

        <RevealOnScroll className="order-1 flex items-center justify-center gap-3 sm:gap-6 lg:order-2">
          <div className="flex min-w-0 flex-col items-center gap-3">
            <div className="flex h-56 w-full max-w-44 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm md:h-64 md:w-52">
              <ProductSilhouette tone="before" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("beforeLabel")}
            </span>
          </div>

          <ArrowRight className="hidden h-6 w-6 flex-shrink-0 text-accent md:block" />

          <div className="flex min-w-0 flex-col items-center gap-3">
            <div className="flex h-56 w-full max-w-44 items-center justify-center rounded-2xl bg-white shadow-[0_24px_48px_-16px_rgba(225,29,72,0.25)] md:h-64 md:w-52">
              <ProductSilhouette tone="after" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
              {t("afterLabel")}
            </span>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
