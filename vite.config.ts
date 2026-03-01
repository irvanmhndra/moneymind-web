import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external access
    port: 5174,
    cors: true
  },
  preview: {
    host: '0.0.0.0', // Allow external access
    port: 5174,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  }
})
