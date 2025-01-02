/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-100': 'var(--color-primary-100)',
        'primary-200': 'var(--color-primary-200)',
        'primary-300': 'var(--color-primary-300)',
        'primary-400': 'var(--color-primary-400)',
        'primary-500': 'var(--color-primary-500)',
        'primary-600': 'var(--color-primary-600)',
        'primary-700': 'var(--color-primary-700)',
        'primary-800': 'var(--color-primary-800)',
        'primary-900': 'var(--color-primary-900)',
        white: 'var(--color-white)',
        black: 'var(--color-black)'
      }
    }
  },
  plugins: []
}
