import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

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
  const baseUrl = SITE_URL;

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
