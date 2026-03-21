import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Nivå Brand
        linen: "#F5F0EB",
        midnight: "#1A1A2E",
        gold: {
          DEFAULT: "#C1A368",
          light: "#D4B87A",
        },
        stone: "#EDE8E3",
        border: "#E8E3DD",

        // Text hierarchy
        "text-primary": "#1A1A2E",
        "text-secondary": "#6B6560",
        "text-muted": "#9E9A95",

        // Grade semantic colors
        grade: {
          green: "#3D7A3A",
          yellow: "#C49520",
          red: "#A93226",
        },
      },
      fontFamily: {
        serif: ["InstrumentSerif_400Regular_Italic"],
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
      },
      spacing: {
        // 8px grid
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "2.5": "20px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
