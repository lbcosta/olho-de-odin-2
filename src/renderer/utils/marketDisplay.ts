// src/renderer/utils/marketDisplay.ts
// Tradução das métricas em tags coloridas e ícones (Sales Metrics 0003).

import type { MarketStatus, PricingStrategy } from '@shared/types/domain'

export const STATUS_DISPLAY: Record<
  MarketStatus,
  { label: string; className: string; tooltip: string }
> = {
  HOT_ITEM: {
    label: '🔥 Hot Item',
    className: 'bg-odin-500/20 text-odin-300',
    tooltip: 'Estoque ativo menor que a média diária — o mercado absorve mais do que repõe.',
  },
  SATURATED: {
    label: '⚠️ Saturado',
    className: 'bg-log-error/20 text-red-300',
    tooltip: 'A oferta atual supera 150% do que o mercado consome por dia.',
  },
  VOLATILE: {
    label: '📈 Volátil',
    className: 'bg-yellow-500/20 text-yellow-300',
    tooltip: 'Variação entre mínimo e máximo do dia acima de 30%.',
  },
  CRASH: {
    label: '🚨 Crash',
    className: 'bg-log-error/30 text-red-200',
    tooltip: 'Queda de preço >30% e volume >50% — possível despejo de estoque.',
  },
  STABLE: {
    label: '⚖️ Dinheiro Certo',
    className: 'bg-log-success/20 text-green-300',
    tooltip: 'Spread e volatilidade abaixo de 10%.',
  },
}

export const STRATEGY_DISPLAY: Record<PricingStrategy, { emoji: string; label: string }> = {
  UNDERCUTTING: { emoji: '⬇️', label: 'Undercutting' },
  PREMIUM: { emoji: '⭐', label: 'Posicionamento Premium' },
  FLIPPING: { emoji: '🔄', label: 'Flipping' },
}

export function formatZeny(value: number): string {
  return `${Math.round(value).toLocaleString('pt-BR')}z`
}

/**
 * Interpreta um carimbo de tempo do app: ISO (`toISOString`, com `T`/`Z`) ou o
 * formato do SQLite (`datetime('now')` → "YYYY-MM-DD HH:MM:SS" em UTC, sem `T`).
 * Retorna `null` para entradas inválidas/vazias.
 */
function parseDbDate(value: string): Date | null {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z')
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatTimestamp(iso: string): string {
  const date = parseDbDate(iso)
  return date ? date.toLocaleString('pt-BR') : iso
}

/**
 * Tempo decorrido em linguagem natural, estilo "comentários do Reddit"
 * ("agora mesmo", "há 3 min", "há 1 dia", "há 2 semanas"). Sempre relativo a
 * `now` (injetável para testes). Cai no valor cru se a data for inválida.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = parseDbDate(iso)
  if (!date) return iso

  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))
  if (seconds < 60) return 'agora mesmo'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return plural(hours, 'hora', 'horas')

  const days = Math.floor(hours / 24)
  if (days < 7) return plural(days, 'dia', 'dias')

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return plural(weeks, 'semana', 'semanas')

  const months = Math.floor(days / 30)
  if (months < 12) return plural(months, 'mês', 'meses')

  return plural(Math.floor(days / 365), 'ano', 'anos')
}

function plural(value: number, singular: string, plural: string): string {
  return `há ${value} ${value === 1 ? singular : plural}`
}
