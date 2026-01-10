import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({...}) // DOMINIC: Disabled for debugging deployment
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase bundle
          'vendor-firebase': [
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
            'firebase/storage'
          ],
          // Charts library
          'vendor-charts': ['recharts'],
          // PDF export utilities - removed to allow dynamic import splitting
          // 'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          // UI libraries (icons only)
          'vendor-ui': ['lucide-react'],
          // Google AI
          'vendor-ai': ['@google/generative-ai'],
          // Email service
          'vendor-email': ['@emailjs/browser']
        }
      }
    }
  }
})
