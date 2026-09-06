import { useTranslations } from "next-intl";
import { products } from "@/data/products";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FinalCTA() {
  const t = useTranslations("finalCta");

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] bg-night py-24 md:py-32">
      <div
        className="accent-glow pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[960px] max-w-none -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("heading")}
          </h2>
          <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
            {t("subheading")}
          </p>
          <Button href="/#products" variant="primary" className="mt-2">
            {t("cta")}
          </Button>

          <div
            aria-hidden="true"
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <span
                  key={product.slug}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-neutral-500"
                >
                  <Icon size={15} strokeWidth={1.75} />
                </span>
              );
            })}
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
