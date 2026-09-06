import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";
import { buildAlternates } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products" });

  return {
    title: t("items.trading-analytics.name"),
    alternates: buildAlternates("/trading"),
  };
}

export default async function TradingAnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "products" });
  const tp = await getTranslations({ locale, namespace: "placeholder" });

  return (
    <PlaceholderPage
      name={t("items.trading-analytics.name")}
      message={tp("toolMessage")}
    />
  );
}
