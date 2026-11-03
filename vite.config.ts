import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset URLs are required when Electron loads index.html from file://.
  // Capacitor also packages dist/ locally, so this keeps both native targets offline.
  base: './',
  plugins: [react(), tailwindcss()],
})
