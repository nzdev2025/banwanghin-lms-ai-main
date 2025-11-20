import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false, // Try next available port if 3000 is taken
    host: true, // Expose to network, helps with some binding issues
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase chunk size limit to avoid warnings
  }
})
