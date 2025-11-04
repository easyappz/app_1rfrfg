/* Tailwind CSS config for CRA */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e11",
        card: "#0f141a",
        muted: "#9aa4b2",
        text: "#e8edf2",
        brand: "#4f46e5"
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0,0,0,0.25)"
      }
    },
    container: {
      center: true,
      padding: "1rem"
    }
  },
  plugins: []
};
