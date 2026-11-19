import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
