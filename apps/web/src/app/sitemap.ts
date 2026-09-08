import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

// Coming-soon tool pages (/cv, /study, /interview, /trading) are noindex and
// intentionally omitted until they ship — see their generateMetadata.
const PATHS = [
  "/",
  "/product-photos",
  "/terms",
  "/privacy",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const lastModified = new Date();

  return PATHS.map((path) => {
    const suffix = path === "/" ? "" : path;
    return {
      url: `${baseUrl}${suffix || "/"}`,
      lastModified,
      alternates: {
        languages: {
          es: `${baseUrl}${suffix || "/"}`,
          en: `${baseUrl}/en${suffix}`,
        },
      },
    };
  });
}
