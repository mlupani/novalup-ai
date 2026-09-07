import { createHash } from "node:crypto";

export interface UploadImageInput {
  data: Buffer;
  contentType: string;
}

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be set");
  }
  const folder = process.env.CLOUDINARY_FOLDER || "product-photos";
  return { cloudName, apiKey, apiSecret, folder };
}

// Cloudinary's signed-upload signature: sort the signed params by key, join as
// `k=v` with `&`, append the api_secret directly, then take the hex SHA-1 digest.
function sign(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/**
 * Upload one image to Cloudinary under the configured folder and return its
 * public `secure_url`. Cloudinary assigns a random public_id, so the URL is not
 * enumerable.
 */
export async function uploadImage(data: Buffer, contentType: string): Promise<{ url: string }> {
  const { cloudName, apiKey, apiSecret, folder } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ folder, timestamp }, apiSecret);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(data)], { type: contentType }));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { secure_url?: string };
  if (!body.secure_url) {
    throw new Error(`Cloudinary upload returned no secure_url: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return { url: body.secure_url };
}

/** Upload several images in parallel, returning their `secure_url`s in input order. */
export async function uploadImages(images: UploadImageInput[]): Promise<string[]> {
  return Promise.all(images.map((img) => uploadImage(img.data, img.contentType).then((r) => r.url)));
}
