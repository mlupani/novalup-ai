import type { StyleId, BackgroundId } from "@/lib/ai/options";

const BASE = [
  "Create a professional commercial product photograph from the provided product image.",
  "Preserve the exact product identity. Preserve its shape, proportions, colors, branding, labels and packaging.",
  "Do not invent, add, or modify important product details.",
  "Make the product the clear visual focus. Use realistic lighting, realistic shadows, and natural materials.",
  "High-end commercial photography. Photorealistic result.",
].join(" ");

const STYLE_BLOCKS: Record<StyleId, string> = {
  studio: "Style: clean professional studio product photography on a seamless backdrop with controlled, even lighting.",
  lifestyle: "Style: lifestyle photography — place the product naturally in a realistic scene or environment where it would be used, with soft natural light.",
  luxury: "Style: premium editorial aesthetic — refined styling, elegant composition, dramatic directional light, high-end magazine feel.",
  minimal: "Style: minimal modern composition — lots of negative space, a single light direction, restrained palette.",
  "social-media": "Style: bold, high-contrast, thumb-stopping framing optimized for social media feeds.",
};

const BACKGROUND_BLOCKS: Record<BackgroundId, string> = {
  clean: "Background: a clean, uncluttered neutral surface that keeps all attention on the product.",
  premium: "Background: a premium tactile setting — subtle textures such as stone, brushed metal, or fine fabric.",
  natural: "Background: a natural setting with organic materials, plants, wood, or daylight.",
  custom: "Background: follow the additional instructions for the setting.",
};

export function buildPrompt(input: {
  style: StyleId;
  background: BackgroundId;
  instructions?: string | null;
}): string {
  const parts = [BASE, STYLE_BLOCKS[input.style], BACKGROUND_BLOCKS[input.background]];
  const extra = input.instructions?.trim();
  if (extra) parts.push(`Additional instructions: ${extra}`);
  return parts.join("\n\n");
}
