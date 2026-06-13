import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#06150d",
          900: "#082014",
          800: "#0d2c1c",
          700: "#123b26"
        },
        grass: {
          500: "#19c37d",
          400: "#35d990",
          300: "#79e7b6"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(53, 217, 144, 0.2), 0 18px 60px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
