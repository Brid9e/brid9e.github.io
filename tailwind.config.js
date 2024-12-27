/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        p: 'var(--color-primary)'
      }
    }
  },
  plugins: []
}
