/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1B263B',
        'brand-dark': '#0D1B2A',
        'brand-green': '#2D6A4F',
      }
    },
  },
  plugins: [],
}
