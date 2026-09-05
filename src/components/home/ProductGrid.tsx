import { useTranslations } from "next-intl";
import { products } from "@/data/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { ProductCard } from "@/components/home/ProductCard";

export function ProductGrid() {
  const t = useTranslations("products");

  return (
    <section id="products" className="bg-paper py-24 md:py-32">
      <Container className="flex flex-col gap-14">
        <SectionHeading heading={t("heading")} subheading={t("subheading")} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <RevealOnScroll key={product.slug} delayMs={index * 80}>
              <ProductCard product={product} />
            </RevealOnScroll>
          ))}
        </div>
      </Container>
    </section>
  );
}
