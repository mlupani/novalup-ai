import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TempHome />;
}

function TempHome() {
  const t = useTranslations("hero");
  return (
    <main className="min-h-screen bg-ink py-24">
      <Container>
        <RevealOnScroll className="flex flex-col items-center gap-6 text-center">
          <SectionHeading heading={t("headline")} tone="dark" />
          <Button href="/#products" variant="primary">
            {t("ctaPrimary")}
          </Button>
        </RevealOnScroll>
      </Container>
    </main>
  );
}
