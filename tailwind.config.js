/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F5F7",
        slate: {
          50: "#FAFAFA",
          100: "#18181B",
          200: "#27272A",
          300: "#3F3F46",
          400: "#52525B",
          500: "#71717A",
          600: "#A1A1AA",
          700: "#D4D4D8",
          800: "#E4E4E7",
          900: "#F4F4F5",
          950: "#FFFFFF",
        },
        amber: {
          DEFAULT: "#D97706",
          soft: "#B45309",
          300: "#A16207",
          400: "#B45309",
          500: "#D97706",
          600: "#B45309",
        },
        emerald: {
          300: "#047857",
          400: "#059669",
          500: "#10B981",
        },
        indigo: {
          DEFAULT: "#0B69E3",
          soft: "#1477F8",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#2563EB",
          400: "#1477F8",
          500: "#0B69E3",
          600: "#0757C7",
          700: "#164EA0",
          800: "#1E3A8A",
          900: "#172554",
          950: "#0F172A",
        },
        rose: {
          300: "#BE123C",
          400: "#E11D48",
          500: "#F43F5E",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 12px 34px rgba(29,29,31,.06)",
      },
    },
  },
  plugins: [],
};
