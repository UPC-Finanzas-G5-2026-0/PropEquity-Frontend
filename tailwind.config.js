/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1B263B',
        'brand-dark': '#0D1B2A',   // El color del panel izquierdo
        'brand-green': '#2D6A4F',
        'brand-orange': '#D97706', // Color aproximado para el botón de registro
        'brand-light': '#F3F4F6',
      }
    },
  },
  plugins: [],
}
