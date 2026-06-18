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
 * Igual a {@link formatZeny}, mas devolve "—" para valores ausentes (≤ 0).
 * A Média Ponderada depende do histórico; sem ele o valor é 0 — e mostrar
 * "0z" engana. Use para métricas derivadas do histórico de preços.
 */
export function formatZenyOrDash(value: number): string {
  return value > 0 ? formatZeny(value) : '—'
}

function toDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
}

export function formatTimestamp(iso: string): string {
  const date = toDate(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR')
}

/**
 * Tempo relativo em pt-BR ("agora", "há 3 min", "há 1 dia", "há 1 semana"),
 * no estilo dos comentários do Reddit. `now` é injetável para testes.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = toDate(iso)
  if (Number.isNaN(date.getTime())) return iso
  const sec = Math.round((now.getTime() - date.getTime()) / 1000)
  if (sec < 45) return 'agora'
  const min = Math.round(sec / 60)
  if (min < 60) return min <= 1 ? 'há 1 min' : `há ${min} min`
  const hr = Math.round(min / 60)
  if (hr < 24) return hr <= 1 ? 'há 1 h' : `há ${hr} h`
  const day = Math.round(hr / 24)
  if (day < 7) return day <= 1 ? 'há 1 dia' : `há ${day} dias`
  const week = Math.round(day / 7)
  if (week < 5) return week <= 1 ? 'há 1 semana' : `há ${week} semanas`
  const month = Math.round(day / 30)
  if (month < 12) return month <= 1 ? 'há 1 mês' : `há ${month} meses`
  const year = Math.round(day / 365)
  return year <= 1 ? 'há 1 ano' : `há ${year} anos`
}
