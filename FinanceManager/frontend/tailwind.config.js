/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
      },
      keyframes: {
      slide: {
        '0%':   { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(350%)' },
      }
    },
    },
  },
  plugins: [],
}
