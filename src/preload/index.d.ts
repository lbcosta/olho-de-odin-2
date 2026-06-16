// src/preload/index.d.ts
// Aumenta o tipo global `window` com a API exposta pelo preload.

import type { OlhoDeOdinApi } from '@shared/types/ipc'

declare global {
  interface Window {
    api: OlhoDeOdinApi
  }
}

export {}
