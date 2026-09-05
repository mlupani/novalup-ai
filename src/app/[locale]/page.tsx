import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TempHome />;
}

function TempHome() {
  const t = useTranslations("hero");
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink">
      <h1 className="text-4xl font-bold text-white">{t("headline")}</h1>
    </main>
  );
}
