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

export function formatTimestamp(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR')
}
