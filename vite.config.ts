import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // manifest je vlastní soubor v public/, plugin ho nemá přepisovat
      manifest: false,
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // 207 log se dnes stahuje při každém načtení
        runtimeCaching: [
          {
            urlPattern: /\/logos\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'station-logos',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],
        // stream se nikdy necachuje - jde o živé vysílání
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
