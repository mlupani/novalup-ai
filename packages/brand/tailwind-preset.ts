import type { Config } from "tailwindcss";

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0B0B0D", soft: "#101014", card: "#141418" },
        accent: { DEFAULT: "#e11d48", dark: "#be123c", light: "#fb7185" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        "float-sm": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: { float: "float 6s ease-in-out infinite", "float-sm": "float-sm 7s ease-in-out infinite" },
    },
  },
};

export default preset;
