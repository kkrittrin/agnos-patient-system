/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        paper: "#FBF9F6",
        ink: {
          DEFAULT: "#1F3A3D",
          light: "#3C5C5F",
        },
        clay: {
          DEFAULT: "#C97B63",
          light: "#E3A88F",
          dark: "#A85F49",
        },
        sage: {
          DEFAULT: "#6B8F71",
          light: "#9AB89F",
        },
        dust: {
          DEFAULT: "#A8A29B",
          light: "#D8D3CC",
        },
        slate: {
          950: "#12181B",
          900: "#182226",
          850: "#1D292E",
        },
      },
      keyframes: {
        pulse_ring: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "80%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
      },
    },
  },
  plugins: [],
};
