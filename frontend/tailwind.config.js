/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0C3B25",        // Deep forest green
          primary: "#059669",     // Fresh emerald green
          "primary-hover": "#047857",
          light: "#ECFDF5",       // Soft mint
          border: "#D1FAE5",      // Subtle mint border
          cream: "#FAFAF8",       // Warm off-white background
          surface: "#FFFFFF",     // Clean card white
          muted: "#6B7280",       // Neutral text
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
