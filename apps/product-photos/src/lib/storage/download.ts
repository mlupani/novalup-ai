/**
 * Turn a Cloudinary delivery URL into one that forces a download. Cloudinary
 * honours the `fl_attachment` transformation by returning `Content-Disposition:
 * attachment`, which works cross-origin where the `<a download>` attribute does
 * not. A URL that is not a Cloudinary `/upload/` URL is returned unchanged.
 */
export function toDownloadUrl(url: string): string {
  if (!url.includes("/upload/") || url.includes("/upload/fl_attachment/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}
