/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090C",
        surface: {
          50: "#1E222D",
          100: "#181B24",
          200: "#13151D",
          300: "#0E1016",
          DEFAULT: "#12141A",
        },
        aura: {
          blue: "#00E5FF",
          purple: "#9D4EDD",
          gold: "#FFD166",
          red: "#FF2A6D",
          green: "#05FFA1",
          dark: "#050608",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 229, 255, 0.3)",
        "glow-purple": "0 0 25px -5px rgba(157, 78, 221, 0.4)",
        "glow-red": "0 0 20px -5px rgba(255, 42, 109, 0.4)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 0.9, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(0.98)" },
        },
        waveformBar: {
          "0%, 100%": { transform: "scaleY(0.2)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "waveform-bar": "waveformBar 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
