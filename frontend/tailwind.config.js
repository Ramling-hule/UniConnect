/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          // Core
          primary:      "#4F8EF7",
          "primary-hover": "#3B78F0",
          "primary-muted": "rgba(79,142,247,0.12)",
          accent:       "#818CF8",
          success:      "#34D399",
          danger:       "#F87171",
          warning:      "#FBBF24",

          // Dark surfaces
          dark:         "#060B18",
          "dark-card":  "#0D1526",
          "dark-elevated": "#141F35",
          "dark-border": "rgba(255,255,255,0.07)",
          "dark-border-strong": "rgba(255,255,255,0.12)",

          // Light surfaces
          light:        "#F0F4FF",
          "light-card": "#FFFFFF",
          "light-elevated": "#F8FAFF",
          "light-border": "rgba(0,0,0,0.08)",
          "light-border-strong": "rgba(0,0,0,0.14)",

          // Text
          "text-primary-dark":   "#E8EFF8",
          "text-secondary-dark": "#6B7FA3",
          "text-primary-light":  "#0F172A",
          "text-secondary-light":"#64748B",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
        "card-dark": "0 1px 3px rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(79,142,247,0.25)",
        "glow-sm": "0 0 12px rgba(79,142,247,0.18)",
        "primary-lg": "0 8px 30px rgba(79,142,247,0.4)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      animation: {
        shimmer:       "shimmer 2s linear infinite",
        "fade-up":     "fadeUp 0.5s ease-out forwards",
        "slide-in-right": "slideInRight 0.3s ease-out forwards",
        float:         "float 6s ease-in-out infinite",
        "pulse-slow":  "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};