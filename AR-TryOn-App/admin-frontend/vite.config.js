import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // Use IPv4 loopback to avoid IPv6 (::1) connection refusals on some setups
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
