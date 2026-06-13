/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Brand colors - Black Shortz palette
      colors: {
        brand: {
          red: '#E50914',
          gold: '#C49A4F',           // Primary Gold
          'gold-hover': '#E2C18D',   // Hover Gold
          'gold-deep': '#936648',    // Deep Gold
          dark: '#0F0E0F',           // Background (near black)
          card: '#18181B',           // Surface/Card (dark gray)
          border: '#2A2A2F',         // Border (soft gray)
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