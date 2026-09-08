import { useTranslations } from "next-intl";
import { Aperture, Sun, Gem, Minimize2, Share2, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const STYLES: { key: string; icon: LucideIcon }[] = [
  { key: "studio", icon: Aperture },
  { key: "lifestyle", icon: Sun },
  { key: "luxury", icon: Gem },
  { key: "minimal", icon: Minimize2 },
  { key: "social", icon: Share2 },
];

export function Styles() {
  const t = useTranslations("productPhotos.styles");

  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-night-soft py-24 md:py-32">
      <div
        className="accent-glow pointer-events-none absolute left-[-10%] top-1/2 h-[520px] w-[720px] max-w-none -translate-y-1/2"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex flex-col gap-14">
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STYLES.map(({ key, icon: Icon }, index) => (
            <RevealOnScroll key={key} delayMs={(index % 3) * 80}>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/[0.07] bg-night-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent-light">
                  <Icon size={20} />
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-white">
                  {t(`${key}Name`)}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-400">
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
