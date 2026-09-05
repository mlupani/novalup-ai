import type { MetadataRoute } from "next";

const PATHS = [
  "/",
  "/product-photos",
  "/cv",
  "/study",
  "/interview",
  "/trading",
  "/terms",
  "/privacy",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://novalup.ai";

  return PATHS.map((path) => {
    const suffix = path === "/" ? "" : path;
    return {
      url: `${baseUrl}${suffix || "/"}`,
      alternates: {
        languages: {
          es: `${baseUrl}${suffix || "/"}`,
          en: `${baseUrl}/en${suffix}`,
        },
      },
    };
  });
}
