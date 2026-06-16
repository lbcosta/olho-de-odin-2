// src/shared/log.ts
// Utilidades puras do Request Log, compartilhadas entre Main e Renderer.
// Mapeia o estado de uma requisição para o token de cor semântica
// definido na spec (0003-Visao Expandida de Desenvolvedor).

import type { RequestLogStatus } from './types/domain'

/** Tokens de cor semântica (alinhados a `theme.colors.log` do Tailwind). */
export type LogColorToken = 'success' | 'error' | 'pending' | 'progress'

/**
 * Resolve a cor semântica de uma entrada de log.
 * - SUCCESS  -> verde
 * - ERROR    -> vermelho (parse, timeout, hash expirado, 429)
 * - IN_PROGRESS -> amarelo
 * - PENDING  -> cinza (congelado na fila aguardando o cooldown de 3s)
 */
export function resolveLogColor(status: RequestLogStatus): LogColorToken {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'ERROR':
      return 'error'
    case 'IN_PROGRESS':
      return 'progress'
    case 'PENDING':
      return 'pending'
  }
}

/** Limite protetivo de memória da View Expandida (OOM Prevention). */
export const LOG_HISTORY_LIMIT = 50

/**
 * Anexa uma entrada ao histórico mantendo apenas os últimos
 * {@link LOG_HISTORY_LIMIT} registros (`slice(-50)`), evitando memory leak
 * em sessões longas (72h+) no Renderer Process.
 */
export function appendBounded<T>(history: readonly T[], entry: T): T[] {
  return [...history, entry].slice(-LOG_HISTORY_LIMIT)
}
