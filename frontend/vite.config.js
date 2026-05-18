import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      crypto: '/src/polyfills/crypto.js',
      zlib: '/src/polyfills/zlib.js',
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
