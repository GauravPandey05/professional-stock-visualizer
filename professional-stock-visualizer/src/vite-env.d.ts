/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_API_KEY: string
  readonly VITE_ENVIRONMENT: string
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}