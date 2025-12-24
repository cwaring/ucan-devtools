import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: 'playground',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
