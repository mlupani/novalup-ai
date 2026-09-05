import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function PlaceholderPage({
  name,
  message,
}: {
  name: string;
  message: string;
}) {
  const t = useTranslations("placeholder");

  return (
    <section className="flex min-h-[60vh] items-center bg-paper py-24">
      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <span className="rounded-full bg-paper-alt px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("badge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {name}
          </h1>
          <p className="text-lg text-neutral-600">{message}</p>
          <Button href="/" variant="primary">
            {t("backHome")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
