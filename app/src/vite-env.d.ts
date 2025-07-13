/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WEATHER_API_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
