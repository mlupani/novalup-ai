import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export function FreeUsage() {
  const t = useTranslations("freeUsage");

  return (
    <section id="free-usage" className="bg-paper-alt py-24 md:py-32">
      <Container>
        <RevealOnScroll className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-sm">
            <BadgeCheck size={22} />
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {t("heading")}
          </h2>
          <p className="text-lg text-neutral-600">{t("body")}</p>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
