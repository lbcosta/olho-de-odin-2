// src/renderer/hooks/useRelativeTime.ts
// Mantém um texto de tempo relativo ("há 3 min") vivo, re-renderizando em um
// intervalo curto SEM precisar re-buscar dados. Use via <RelativeTime />.

import { useEffect, useState } from 'react'
import { formatRelativeTime } from '../utils/marketDisplay'

export function useRelativeTime(iso: string | null | undefined, intervalMs = 30_000): string {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!iso) return
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [iso, intervalMs])
  return iso ? formatRelativeTime(iso) : '—'
}
