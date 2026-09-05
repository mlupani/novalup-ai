import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEP_KEYS = ["step1", "step2", "step3", "step4"] as const;

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section id="how-it-works" className="bg-paper py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} />
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((key, index) => (
            <RevealOnScroll key={key} delayMs={index * 80}>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-ink">
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-500">
                  {t(`${key}Body`)}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
