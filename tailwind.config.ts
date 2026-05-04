import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Locked in /plan-design-review:
      // - Inter (body / UI / labels)  — softer than Satoshi, fits SME audience
      // - JetBrains Mono (technical chips ONLY) — personality font
      // - No display font in v0
      // - Amber accent: #D97706 (light), #F59E0B (dark surfaces)
      // - Warm beige base, NOT stark white
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Amber accent — used sparingly. Amber-600 on white passes contrast (~4.6:1).
        // Amber-500 on white FAILS contrast — only use on dark surfaces.
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706", // primary on light backgrounds
          700: "#B45309",
        },
        // Warm beige base
        cream: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          800: "#292524",
          900: "#1C1917",
        },
        zinc: {
          50: "#FAFAFA",
          400: "#A1A1AA",
          600: "#52525B",
          800: "#27272A",
          900: "#18181B",
        },
      },
      maxWidth: {
        // Single-focus calm column — locked in /plan-design-review
        prose: "640px",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "640px",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
