import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0a0a0a",
          800: "#111111",
          700: "#171717",
          600: "#1f1f1f",
          500: "#2a2a2a",
          400: "#3a3a3a",
          300: "#5a5a5a",
          200: "#8a8a8a",
          100: "#c4c4c4",
        },
        accent: {
          win: "#5eead4",
          loss: "#f87171",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      animation: {
        "flash-win": "flashWin 600ms ease-out",
        "flash-loss": "flashLoss 600ms ease-out",
        "pulse-soft": "pulseSoft 400ms ease-out",
        "slide-up": "slideUp 280ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 180ms ease-out",
      },
      keyframes: {
        flashWin: {
          "0%": { backgroundColor: "rgba(94, 234, 212, 0.0)" },
          "30%": { backgroundColor: "rgba(94, 234, 212, 0.18)" },
          "100%": { backgroundColor: "rgba(94, 234, 212, 0)" },
        },
        flashLoss: {
          "0%": { backgroundColor: "rgba(248, 113, 113, 0.0)" },
          "30%": { backgroundColor: "rgba(248, 113, 113, 0.18)" },
          "100%": { backgroundColor: "rgba(248, 113, 113, 0)" },
        },
        pulseSoft: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0%)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
