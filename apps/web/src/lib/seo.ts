import { SITE_URL, PRODUCT_PHOTOS_URL } from "@/lib/constants";

/**
 * Per-page `alternates` for Next metadata. Paths are relative — Next resolves
 * them against `metadataBase` (SITE_URL). `localePrefix` is "as-needed" with
 * `es` as the default locale, so `es` URLs have no prefix and `en` URLs get
 * `/en`.
 */
export function buildAlternates(pathname: string, locale: string) {
  const path = pathname === "/" ? "" : pathname;
  const es = path || "/";
  const en = `/en${path}` || "/en";

  return {
    canonical: locale === "en" ? en : es,
    languages: {
      es,
      en,
      "x-default": es,
    },
  };
}

/**
 * schema.org Organization + WebSite graph for the home page, emitted as
 * JSON-LD. Kept minimal on purpose — per-tool SoftwareApplication nodes are a
 * follow-up.
 */
export function siteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Novalup AI",
        url: SITE_URL,
        logo: `${SITE_URL}/opengraph-image`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Novalup AI",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: locale === "en" ? "en-US" : "es-AR",
      },
    ],
  };
}

/**
 * schema.org SoftwareApplication for the Product Photos tool. `offers` is a
 * free tier, so price is "0".
 */
export function productPhotosJsonLd(locale: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: PRODUCT_PHOTOS_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    inLanguage: locale === "en" ? "en-US" : "es-AR",
    publisher: { "@type": "Organization", name: "Novalup AI", url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** schema.org FAQPage from a list of question/answer pairs. */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
