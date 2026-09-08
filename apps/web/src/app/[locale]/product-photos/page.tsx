import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { Hero } from "@/components/product-photos/Hero";
import { Steps } from "@/components/product-photos/Steps";
import { Styles } from "@/components/product-photos/Styles";
import { Faq } from "@/components/product-photos/Faq";
import { buildAlternates, faqJsonLd, productPhotosJsonLd } from "@/lib/seo";
import { PRODUCT_PHOTOS_URL } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

const FAQ_KEYS = ["1", "2", "3", "4", "5"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "productPhotos.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/product-photos", locale),
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function ProductPhotosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMeta = await getTranslations("productPhotos.meta");
  const tFaq = await getTranslations("productPhotos.faq");
  const tFree = await getTranslations("productPhotos.free");
  const tCta = await getTranslations("productPhotos.cta");

  const faqItems = FAQ_KEYS.map((n) => ({ q: tFaq(`q${n}`), a: tFaq(`a${n}`) }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productPhotosJsonLd(locale, tMeta("title"), tMeta("description")),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />

      <Hero />
      <Steps />
      <Styles />

      <section className="relative overflow-hidden border-y border-white/[0.06] bg-night-soft py-24 md:py-32">
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
              {tFree("heading")}
            </h2>
            <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
              {tFree("body")}
            </p>
            <Button href={PRODUCT_PHOTOS_URL} variant="primary" className="mt-2">
              {tFree("cta")}
            </Button>
          </RevealOnScroll>
        </Container>
      </section>

      <Faq />

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-night py-24 md:py-32">
        <div
          className="accent-glow pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[960px] max-w-none -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
        <Container className="relative z-10">
          <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              {tCta("heading")}
            </h2>
            <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
              {tCta("subheading")}
            </p>
            <Button href={PRODUCT_PHOTOS_URL} variant="primary" className="mt-2">
              {tCta("button")}
            </Button>
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}
