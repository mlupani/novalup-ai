import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
// import { FeaturedProduct } from "@/components/home/FeaturedProduct"; // temporarily hidden, see below
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
    alternates: buildAlternates("/"),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductGrid />
      {/* FeaturedProduct temporarily hidden at the user's request — re-enable when ready. */}
      <HowItWorks />
      <FreeUsage />
      <About />
      <FinalCTA />
    </>
  );
}
