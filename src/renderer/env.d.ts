// src/renderer/env.d.ts
/// <reference types="vite/client" />

import type { OlhoDeOdinApi } from '@shared/types/ipc'

declare global {
  interface Window {
    api: OlhoDeOdinApi
  }
}

export {}
