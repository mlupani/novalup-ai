import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { ProductGrid } from "@/components/home/ProductGrid";
import { FeaturedProduct } from "@/components/home/FeaturedProduct";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FreeUsage } from "@/components/home/FreeUsage";
import { About } from "@/components/home/About";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <ProductGrid />
      <FeaturedProduct />
      <HowItWorks />
      <FreeUsage />
      <About />
    </>
  );
}
