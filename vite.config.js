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
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Firebase bundle
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Charts library
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // React libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Icons
            if (id.includes('lucide-react') || id.includes('@ant-design/icons')) {
              return 'vendor-icons';
            }
            // Google AI - lazy
            if (id.includes('@google/generative-ai')) {
              return 'vendor-ai';
            }
            // Email service - lazy
            if (id.includes('@emailjs/browser')) {
              return 'vendor-email';
            }
            // Video players - lazy
            if (id.includes('react-player') || id.includes('hls') || id.includes('dash')) {
              return 'vendor-video';
            }
            // PDF generation - lazy
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            // Framer Motion - lazy
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // DnD kit - lazy
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            // QR scanner - lazy
            if (id.includes('@yudiel/react-qr-scanner')) {
              return 'vendor-qr';
            }
            // Confetti - lazy
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
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
