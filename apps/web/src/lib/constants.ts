// Canonical origin of the marketing site. Inlined at build time (see
// apps/web/Dockerfile); drives metadataBase, canonicals, OG URLs, sitemap
// and robots. No trailing slash.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai.novaluptech.com"
).replace(/\/+$/, "");

export const PRODUCT_PHOTOS_URL =
  process.env.NEXT_PUBLIC_PRODUCT_PHOTOS_URL ?? "http://localhost:3000";

// GA4 Measurement ID (G-XXXXXXXXXX). Unset -> Analytics is not loaded.
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const NAV_LINKS = [
  { key: "products", href: "/#products" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "about", href: "/#about" },
] as const;

export const FOOTER_LINKS = [
  { key: "products", href: "/#products" },
  { key: "about", href: "https://novaluptech.com/nosotros" },
  { key: "terms", href: "/terms" },
  { key: "privacy", href: "/privacy" },
  { key: "contact", href: "https://novaluptech.com/agendar" },
] as const;
