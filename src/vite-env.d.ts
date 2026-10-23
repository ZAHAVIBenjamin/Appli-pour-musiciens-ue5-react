/// <reference types="vite/client" />

// Variables d'environnement typées (voir .env.example)
interface ImportMetaEnv {
  readonly VITE_TABS_API_URL: string
  readonly VITE_TABS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
