/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        shield: {
          ink: "#0c1a14",
          forest: "#14532d",
          mint: "#16a34a",
          sand: "#f4f1ea",
          steel: "#334155",
          risk: "#b91c1c",
          warn: "#b45309",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Segoe UI", "sans-serif"],
        arabic: ["var(--font-arabic)", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};
