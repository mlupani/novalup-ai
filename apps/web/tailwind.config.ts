import type { Config } from "tailwindcss";
import brandPreset from "@novalup/brand/tailwind-preset";

const config: Config = {
  presets: [brandPreset],
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [],
};

export default config;
