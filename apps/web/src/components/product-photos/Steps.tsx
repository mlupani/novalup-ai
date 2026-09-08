import { useTranslations } from "next-intl";
import { Upload, SlidersHorizontal, Sparkles, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEPS: { key: string; icon: LucideIcon }[] = [
  { key: "step1", icon: Upload },
  { key: "step2", icon: SlidersHorizontal },
  { key: "step3", icon: Sparkles },
];

export function Steps() {
  const t = useTranslations("productPhotos.steps");

  return (
    <section className="bg-night py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <span
            aria-hidden="true"
            className="hairline absolute left-[8%] right-[8%] top-12 hidden h-px md:block"
          />

          {STEPS.map(({ key, icon: Icon }, index) => (
            <RevealOnScroll key={key} delayMs={index * 90}>
              <div className="flex flex-col gap-5">
                <div
                  aria-hidden="true"
                  className="relative z-10 flex h-24 items-center justify-center rounded-xl border border-white/[0.07] bg-night-card"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent-light">
                    <Icon size={20} />
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold tracking-[0.2em] text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {t(`${key}Title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    {t(`${key}Body`)}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
