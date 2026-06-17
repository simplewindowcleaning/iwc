import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#a78bfa",
        "accent-dim": "rgba(167,139,250,0.18)",
        bg: "#080810",
      },
      fontFamily: {
        grotesk: ["var(--font-space-grotesk)", "sans-serif"],
      },
      borderRadius: {
        phone: "46px",
      },
      boxShadow: {
        phone: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
