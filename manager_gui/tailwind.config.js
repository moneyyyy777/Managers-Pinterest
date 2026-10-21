/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        surface: "#ffffff",
        surfaceLight: "#f3f4f6",
        surfaceBorder: "#e5e7eb",
        textPrimary: "#111827",
        textSecondary: "#4b5563",
        textMuted: "#9ca3af",
        accent: {
          DEFAULT: "#E60023", // Official Pinterest Red
          hover: "#ad081b",
          light: "#fef2f2",
          border: "#fee2e2",
          purple: "#8b5cf6",
          emerald: "#10b981",
          amber: "#f59e0b",
          cyan: "#06b6d4"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
