import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

import fs from 'fs';
import path from 'path';

// Read version from public/version.json to ensure consistency with generate-version.js
let appVersion = new Date().getTime().toString();
try {
  const versionPath = path.resolve(__dirname, 'public/version.json');
  if (fs.existsSync(versionPath)) {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
    appVersion = versionData.version;
  }
} catch (e) {
  console.warn('Could not read version.json, falling back to timestamp');
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(appVersion)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Repaart Operativa',
        short_name: 'Repaart',
        description: 'Sistema Operativo para Franquicias de Última Milla',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000, // Increase limit for large chunks
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    }),
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
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  }
})
