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
          dark: '#0D2B26',      // Deep Teal (Headings)
          primary: '#16423C',   // Main Teal (Buttons)
          light: '#E7F0EE',     // Light Background Tint
          accent: '#C4F03C',    // Lime Pop
        }
      },
      boxShadow: {
        'float': '0 20px 40px -10px rgba(13, 43, 38, 0.15)', // Soft shadow
      }
    },
  },
  plugins: [],
};