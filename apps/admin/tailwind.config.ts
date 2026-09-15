import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../apps/shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06080b",
        panel: "#111820",
        gold: "#f0b83f",
        mint: "#00df86",
        muted: "#90a09a"
      }
    }
  },
  plugins: []
};

export default config;
