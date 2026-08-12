import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,jpg,mp4,webm}'],
          maximumFileSizeToCacheInBytes: 150 * 1024 * 1024, // 150MB para suportar vídeos razoáveis
          runtimeCaching: [
            {
              urlPattern: /.*\.(?:mp4|webm|ogv|mov|jpg|jpeg|png|svg|gif|webp)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'media-cache',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'backend/public',
      emptyOutDir: false,
      target: ['es2020', 'edge88', 'firefox78', 'chrome74', 'safari13'],
      cssTarget: 'chrome74',
    },
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: {
          chrome: 74 << 16,
          android: 74 << 16
        }
      }
    }
  };
});
