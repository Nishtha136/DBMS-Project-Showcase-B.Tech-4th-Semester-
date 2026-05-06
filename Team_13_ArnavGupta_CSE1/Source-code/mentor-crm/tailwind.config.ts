import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#E1F7F2",
          100: "#B6ECE0",
          400: "#3CD0B6",
          500: "#22C1A8",
          600: "#159E89",
          700: "#107D6D",
        },
        ink: {
          900: "#0F1115",
          800: "#181B22",
          700: "#252934",
          600: "#3A3F4B",
          500: "#5C6373",
          400: "#8A91A0",
          300: "#B5BAC4",
          200: "#D9DCE3",
          100: "#EEF0F4",
          50:  "#F7F8FA",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto",
               "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 17, 21, 0.04), 0 4px 12px rgba(15, 17, 21, 0.06)",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
