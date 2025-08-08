import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3012,
    host: true,
    https: false,
    hmr: process.env.VITE_DISABLE_HMR === 'true' ? false : undefined
  }
})