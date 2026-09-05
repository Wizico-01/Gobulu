/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors mapped to Deep Navy (No electric blue)
        royal: "#0A0F2D",          // Main Buttons & Accents (Deep Navy)
        "royal-dark": "#05081A",   // Button Hover State (Darker Navy)
        "royal-deep": "#0A0F2D",   // Secondary Deep Navy Accent

        // Main Background Navy Palette
        ink: "#0A0F2D",            // Dark Navy (Hero & Footer)
        "ink-light": "#11183C",     // Cards & Panels Navy
        "ink-border": "#1E293B",    // Borders & Dividers

        // Light Neutrals
        paper: "#FFFFFF",          // White
        mist: "#F8FAFC",           // Light Background
        line: "#E2E8F0",           // Border Lines

        // Trading Indicators
        bull: "#10B981",
        bear: "#F43F5E",
        gold: "#F59E0B",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};