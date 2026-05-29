/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Brand colors
      colors: {
        brand: {
          red: '#E50914',
          gold: '#F5C518',
          dark: '#0A0A0F',
          card: '#111118',
          border: '#1E1E2E',
        },
      },
      // Custom font families
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
