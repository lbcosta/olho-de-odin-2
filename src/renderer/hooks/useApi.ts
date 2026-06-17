// src/renderer/hooks/useApi.ts
// Acesso seguro à ponte do preload (degrada fora do Electron, ex.: testes).

import type { OlhoDeOdinApi } from '@shared/types/ipc'

export function getApi(): OlhoDeOdinApi | null {
  if (typeof window === 'undefined') return null
  return window.api ?? null
}
