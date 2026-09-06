import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FreeUsage() {
  const t = useTranslations("freeUsage");

  return (
    <section
      id="free-usage"
      className="relative overflow-hidden border-y border-white/[0.06] bg-night-soft py-24 md:py-32"
    >
      <div
        className="accent-glow pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] max-w-none -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-light">
            <Sparkles size={20} />
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            {t("heading")}
          </h2>
          <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
            {t("body")}
          </p>
          <Button href="/#products" variant="primary" className="mt-2">
            {t("cta")}
          </Button>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
