import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ITEMS = ["1", "2", "3", "4", "5"] as const;

export function Faq() {
  const t = useTranslations("productPhotos.faq");

  return (
    <section className="bg-night py-24 md:py-32">
      <Container className="flex flex-col gap-12">
        <SectionHeading heading={t("heading")} />

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {ITEMS.map((n) => (
            <details
              key={n}
              className="group rounded-2xl border border-white/[0.07] bg-night-card px-5 py-4 [&_summary]:list-none"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-medium text-white">
                {t(`q${n}`)}
                <Plus
                  size={18}
                  className="shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                {t(`a${n}`)}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
