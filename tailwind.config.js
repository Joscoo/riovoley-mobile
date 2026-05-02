/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos que busque clases en App.js y en cualquier archivo dentro de una futura carpeta "src"
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}