/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fta-green': '#10b981',
        'fta-green-dark': '#059669',
        'fta-green-light': '#34d399',
        'fta-dark': '#1a1a1a',
        'fta-gray': '#2d2d2d',
        'fta-light-gray': '#3d3d3d',
      },
    },
  },
  plugins: [],
}

