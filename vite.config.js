import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
export default defineConfig(async ({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true';

  const plugins = [react()];

  if (!isTest) {
    const { VitePWA } = await import('vite-plugin-pwa');
    const { visualizer } = await import('rollup-plugin-visualizer');

    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Repaart Operativa',
          short_name: 'Repaart',
          description: 'Sistema Operativo para Franquicias de Última Milla',
          theme_color: '#6366f1',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          categories: ['business', 'productivity'],
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
          ],
          shortcuts: [
            {
              name: 'Agenda',
              short_name: 'Agenda',
              description: 'Acceder a la agenda de turnos',
              url: '/operations',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Ver el dashboard principal',
              url: '/',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Academia',
              short_name: 'Academia',
              description: 'Formación para riders',
              url: '/academy',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5000000,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/(firestore|storage)\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      })
    );

    plugins.push(
      visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
    );
  }

  return {
    define: {
      '__APP_VERSION__': JSON.stringify(appVersion)
    },
    plugins,
    // CRITICAL: Force all modules to use the same React instance
    // This prevents "Cannot read createContext" errors caused by
    // multiple React copies being bundled
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Normalize path separators for Windows compatibility
            const normalizedId = id.replace(/\\/g, '/');

            // CRITICAL: React MUST be in a single chunk to prevent
            // "Cannot read createContext" errors. This rule MUST be FIRST.
            if (
              normalizedId.includes('node_modules/react/') ||
              normalizedId.includes('node_modules/react-dom/') ||
              normalizedId.includes('node_modules/react-router') ||
              normalizedId.includes('node_modules/scheduler/') ||
              normalizedId.includes('react/jsx-runtime') ||
              normalizedId.includes('react/jsx-dev-runtime')
            ) {
              return 'vendor-react';
            }
            // Firebase bundle - does NOT depend on React
            if (normalizedId.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Google AI - does NOT depend on React
            if (normalizedId.includes('@google/generative-ai')) {
              return 'vendor-ai';
            }
            // Email service - does NOT depend on React
            if (normalizedId.includes('@emailjs/browser')) {
              return 'vendor-email';
            }
            // PDF generation - does NOT depend on React
            if (normalizedId.includes('jspdf') || normalizedId.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Confetti - does NOT depend on React
            if (normalizedId.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
            // HLS/Dash streaming libs - do NOT depend on React
            if (normalizedId.includes('hls.js') || normalizedId.includes('dashjs')) {
              return 'vendor-streaming';
            }
            // NOTE: The following ARE chunked but in the main bundle because
            // they depend on React and must load AFTER React:
            // - recharts, react-player, framer-motion, @dnd-kit
            // - lucide-react, @ant-design/icons, @yudiel/react-qr-scanner
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
    }
  };
});
