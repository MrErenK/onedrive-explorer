import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#000000", // Black for light mode
          dark: "#FFFFFF", // White for dark mode
        },
        secondary: {
          light: "#666666", // Dark gray for light mode
          dark: "#888888", // Light gray for dark mode
        },
        background: {
          light: "#FFFFFF", // White for light mode
          dark: "#000000", // Black for dark mode
        },
        text: {
          light: "#000000", // Black for light mode
          dark: "#FFFFFF", // White for dark mode
        },
        gray: {
          100: "#F5F5F5",
          200: "#EAEAEA",
          300: "#DDDDDD",
          400: "#CCCCCC",
          500: "#999999",
          600: "#666666",
          700: "#444444",
          800: "#333333",
          900: "#111111",
        },
      },
    },
  },
  plugins: [],
};

export default config;
