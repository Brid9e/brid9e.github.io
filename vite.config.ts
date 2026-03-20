import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from 'tailwindcss'

export default defineConfig({
  /** 相对路径：部署在 /brid9e/ 子目录或根域名 / 下都能正确加载 assets */
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    postcss: {
      plugins: [tailwind()]
    }
  },
  server: {
    host: true
  }
})
