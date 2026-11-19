import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA (fiche EI-08) : manifeste (nom, icônes, couleurs) + service worker généré au build.
    // L'appli s'installe sur le téléphone et fonctionne hors ligne (sauf la recherche de tablatures).
    VitePWA({
      registerType: 'autoUpdate', // nouvelle version publiée → le téléphone la récupère tout seul
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Cube Musique',
        short_name: 'Cube Musique',
        description: 'Accordeur, tablatures, métronome, accords et carnet sur un cube 3D',
        lang: 'fr',
        start_url: '/',
        display: 'standalone', // plein écran, sans la barre du navigateur
        orientation: 'portrait',
        background_color: '#111111',
        theme_color: '#111111',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Toutes les adresses de l'appli (/accords...) ouvrent index.html, comme la règle de vercel.json
        navigateFallback: '/index.html',
        // ... sauf l'API Songsterr, qui doit toujours passer par le réseau
        navigateFallbackDenylist: [/^\/api\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // la 3D fait plus de 2 Mo
      },
    }),
  ],
  server: {
    // Proxy (en développement) : le navigateur bloque les appels directs à songsterr.com (CORS).
    // La page appelle donc /api/songsterr/... sur NOTRE serveur, qui transmet à Songsterr.
    // En ligne, c'est vercel.json qui fait la même chose.
    proxy: {
      '/api/songsterr': {
        target: 'https://www.songsterr.com',
        changeOrigin: true, // se présente à Songsterr comme venant de songsterr.com
        rewrite: (path) => path.replace(/^\/api\/songsterr/, '/api'),
      },
    },
  },
})
