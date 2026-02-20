/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // Brand — confident charcoal, Scandinavian editorial
                "primary": "#1A1A1A",
                "primary-light": "#333333",
                "primary-dark": "#0D0D0D",
                "primary-soft": "#F3EDE6",

                // Accent — architectural stone rose
                "accent": "#C4A882",
                "accent-light": "#D4BFA0",
                "accent-dark": "#A68B64",
                "accent-soft": "#FAF5EE",

                // Semantic
                "success": "#5A8A72",
                "success-soft": "#F2F7F4",
                "warning": "#C4A155",
                "danger": "#B84747",
                "danger-soft": "#FDF2F2",

                // Backgrounds
                "page-bg-light": "#FAF8F5",
                "page-bg-dark": "#141414",

                // Surfaces
                "surface-light": "#FDFCFA",
                "surface-dark": "#1E1E1E",
                "surface-muted-light": "#F5F1EB",
                "surface-muted-dark": "#1E1E1E",
                "surface-input": "#F5F1EB",

                // Borders
                "border-light": "#E8E3DC",
                "border-dark": "#2D2D2D",
                "border-input-light": "#DDD7CE",

                // Text
                "text-main": "#1A1A1A",
                "text-muted": "#7A7368",
                "text-secondary": "#9C9488",
                "text-placeholder": "#B5AFA6",
                "text-info": "#5C564E",

                // Legacy aliases
                "wireframe-gray": "#F5F1EB",
                "mid-gray": "#9C9488",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "display": ['"Instrument Serif"', "Georgia", "serif"]
            },
            fontSize: {
                "micro": ["9px", { lineHeight: "1.4", fontWeight: "800" }],
                "nano": ["10px", { lineHeight: "1.4", fontWeight: "700" }],
                "xs-ui": ["11px", { lineHeight: "1.5" }],
                "sm-ui": ["13px", { lineHeight: "1.5" }],
                "body": ["14px", { lineHeight: "1.6" }],
            },
            borderRadius: {
                "ios": "16px",
                "card": "24px",
                "section": "16px",
                "button": "12px",
                "input": "12px",
                "pill": "9999px",
            },
            spacing: {
                "page-x": "20px",
                "page-gap": "24px",
                "card-inset": "20px",
            }
        },
    },
    plugins: [],
}
