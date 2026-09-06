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
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-night py-24">
      <div
        className="accent-glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/3"
        aria-hidden="true"
      />
      <Container className="relative z-10">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
            {t("badge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {name}
          </h1>
          <p className="text-lg leading-relaxed text-neutral-400">{message}</p>
          <Button href="/" variant="secondary">
            {t("backHome")}
          </Button>
        </div>
      </Container>
    </section>
  );
}
