import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8EA",
        wheat: "#D9A441",
        forest: "#183F2F",
        leaf: "#4D7A39",
        mitti: "#4B2F1F",
        clay: "#B56E3B",
        ink: "#16130F"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      boxShadow: {
        glow: "0 24px 80px rgba(24,63,47,.18)",
        card: "0 18px 60px rgba(75,47,31,.12)"
      }
    }
  },
  plugins: []
};

export default config;
