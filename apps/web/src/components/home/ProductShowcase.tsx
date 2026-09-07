import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { PRODUCT_PHOTOS_URL } from "@/lib/constants";

const BEFORE_SRC = "/images/featured-product/before.jpg";
const AFTER_SRC = "/images/featured-product/after.jpg";

/** Result formats the tool produces, mirrored as differently cropped thumbs. */
const RESULT_THUMBS = [
  { ratio: "aspect-square", width: "w-11" },
  { ratio: "aspect-[3/4]", width: "w-8" },
  { ratio: "aspect-[4/3]", width: "w-14" },
];

function ProductPhotosApp() {
  const t = useTranslations("showcase.ui");

  const styles = [t("styleStudio"), t("styleWhite"), t("styleLifestyle")];

  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-night-card shadow-[0_50px_120px_-50px_rgba(0,0,0,1)]"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
        </span>
        <span className="truncate text-[11px] font-medium text-neutral-400">
          {t("window")}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[136px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {/* Side by side on phones so the source photo never outweighs the result. */}
          <div className="flex flex-row items-start gap-4 sm:flex-col">
            <div className="shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {t("original")}
              </span>
              <div className="relative mt-2 aspect-square w-24 overflow-hidden rounded-lg border border-white/[0.07] sm:w-full">
                <Image
                  src={BEFORE_SRC}
                  alt=""
                  fill
                  sizes="136px"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 sm:w-full sm:flex-none">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {t("style")}
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {styles.map((style, index) => (
                  <span
                    key={style}
                    className={`rounded-md border px-2 py-1 text-[10px] font-medium ${
                      index === 0
                        ? "border-accent/40 bg-accent/15 text-accent-light"
                        : "border-white/[0.07] bg-white/[0.03] text-neutral-400"
                    }`}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <span className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-[11px] font-semibold text-white">
            <Sparkles size={12} />
            {t("generate")}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={AFTER_SRC}
              alt=""
              fill
              sizes="(min-width: 1024px) 460px, (min-width: 640px) 60vw, 90vw"
              className="object-contain"
            />
          </div>
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-night/85 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            <Sparkles size={10} className="text-accent-light" />
            {t("aiGenerated")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          {t("results")}
        </span>
        <span className="ml-auto flex items-end gap-2">
          {RESULT_THUMBS.map((thumb, index) => (
            <span
              key={thumb.ratio}
              className={`relative ${thumb.width} ${thumb.ratio} overflow-hidden rounded-md border bg-white ${
                index === 0 ? "border-accent/40" : "border-white/[0.08]"
              }`}
            >
              <Image
                src={AFTER_SRC}
                alt=""
                fill
                sizes="56px"
                className="object-contain"
              />
            </span>
          ))}
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-white/[0.12] text-[10px] font-semibold text-neutral-400">
            +3
          </span>
        </span>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const t = useTranslations("showcase");

  return (
    <section
      id="showcase"
      className="relative overflow-hidden border-y border-white/[0.06] bg-night-soft py-24 md:py-32"
    >
      <div
        className="accent-glow pointer-events-none absolute right-[-10%] top-1/2 h-[560px] w-[760px] max-w-none -translate-y-1/2"
        aria-hidden="true"
      />

      <Container className="relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <RevealOnScroll className="flex flex-col items-start gap-5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-light">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
            {t("heading")}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-neutral-400 md:text-lg">
            {t("subheading")}
          </p>
          <Button href={PRODUCT_PHOTOS_URL} variant="primary" className="mt-2">
            {t("cta")}
          </Button>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120}>
          <ProductPhotosApp />
        </RevealOnScroll>
      </Container>
    </section>
  );
}
