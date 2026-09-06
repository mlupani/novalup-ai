import Image from "next/image";
import { useTranslations } from "next-intl";
import { Camera, Check, Sparkles, Upload } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STEP_KEYS = ["step1", "step2", "step3"] as const;

function StepVisual({ step, label }: { step: number; label: string }) {
  if (step === 0) {
    return (
      <span className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-white">
        <Camera size={14} className="text-accent-light" />
        {label}
        <Check size={13} className="text-accent-light" />
      </span>
    );
  }

  if (step === 1) {
    return (
      <span className="flex items-center gap-2 rounded-lg border border-dashed border-white/[0.16] px-4 py-2.5 text-xs font-medium text-neutral-400">
        <Upload size={14} />
        {label}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/[0.08] bg-white">
        <Image
          src="/images/featured-product/after.jpg"
          alt=""
          fill
          sizes="56px"
          className="object-contain"
        />
      </span>
      <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-neutral-300">
        <Sparkles size={10} className="text-accent-light" />
        {label}
      </span>
    </span>
  );
}

export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section id="how-it-works" className="bg-night py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <span
            aria-hidden="true"
            className="hairline absolute left-[8%] right-[8%] top-12 hidden h-px md:block"
          />

          {STEP_KEYS.map((key, index) => (
            <RevealOnScroll key={key} delayMs={index * 90}>
              <div className="flex flex-col gap-5">
                <div
                  aria-hidden="true"
                  className="relative z-10 flex h-24 items-center justify-center rounded-xl border border-white/[0.07] bg-night-card px-4"
                >
                  <StepVisual step={index} label={t(`${key}Visual`)} />
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
