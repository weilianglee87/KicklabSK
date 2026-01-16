/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'room': "url('/src/assets/background_quickking.png')",
        'dial': "url('/src/assets/quick_king_score.png')",
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif'], // Match legacy font
      }
    },
  },
  plugins: [],
}
