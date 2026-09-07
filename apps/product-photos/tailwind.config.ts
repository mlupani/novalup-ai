import type { Config } from "tailwindcss";
import brandPreset from "@novalup/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: ["./src/{app,components,content,hooks,lib}/**/*.{ts,tsx}"],
  plugins: [],
};

export default config;
