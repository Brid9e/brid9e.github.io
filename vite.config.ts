import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcssPxTpViewport from 'postcss-px-to-viewport-8-plugin'
import viewport from './viewport.config'
import tailwind from 'tailwindcss'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    postcss: {
      plugins: [tailwind(), postcssPxTpViewport(viewport)]
    }
  },
  server: {
    host: true
  }
})
