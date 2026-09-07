export const SITE_URL = "https://novalup.ai";

export const PRODUCT_PHOTOS_URL =
  process.env.NEXT_PUBLIC_PRODUCT_PHOTOS_URL ?? "http://localhost:3000";

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
