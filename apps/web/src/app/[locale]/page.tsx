import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates, siteJsonLd } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { StatementStrip } from "@/components/home/StatementStrip";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FreeUsage } from "@/components/home/FreeUsage";
import { About } from "@/components/home/About";
import { FinalCTA } from "@/components/home/FinalCTA";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/", locale),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(locale)) }}
      />
      <Hero />
      <StatementStrip />
      <ProductGrid />
      <ProductShowcase />
      <HowItWorks />
      <FreeUsage />
      <About />
      <FinalCTA />
    </>
  );
}
