import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Studio Dental',
        short_name: 'StudioDental',
        description: 'Gestión clínica dental — pacientes, agenda, clínica y finanzas',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // F6-J: fallback a index.html si falla la navegacion (cold-start offline)
        navigateFallback: '/index.html',
        // Excluir endpoints de Supabase del fallback (son API, no rutas)
        navigateFallbackDenylist: [
          /^\/rest\/v1\//,
          /^\/auth\/v1\//,
          /^\/storage\/v1\//,
          /^\/realtime\/v1\//
        ],
        // F7-06: API calls a Supabase: network-first, PERO SIN CACHEAR PHI.
        // Los endpoints /rest/v1/, /storage/v1/, /auth/v1/ y /realtime/v1/
        // sirven informacion de salud protegida (PHI) y no deben quedar en
        // la cache del Service Worker (riesgo de fuga si otro usuario usa
        // el mismo dispositivo). Se cachean solo assets estaticos de Supabase.
        // La logica de filtrado vive en src/utils/supabaseCacheFilter.js
        // para ser testeable de forma aislada.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => {
              // Replica de src/utils/supabaseCacheFilter.js (inline porque
              // vite.config.js no puede importar modulos ESM de src/ de forma
              // confiable al construir el SW). Mantener sincronizado.
              if (!url.hostname.includes('supabase')) return false
              const path = url.pathname
              return !(
                path.startsWith('/rest/v1/') ||
                path.startsWith('/storage/v1/') ||
                path.startsWith('/auth/v1/') ||
                path.startsWith('/realtime/v1/')
              )
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 } // 1 dia
            }
          },
          // Assets estaticos: cache-first
          {
            urlPattern: ({ request }) => ['style', 'script', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } // 30 dias
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
})
