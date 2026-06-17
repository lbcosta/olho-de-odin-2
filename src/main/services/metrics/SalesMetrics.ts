// src/main/services/metrics/SalesMetrics.ts
// Motor matemático puro de métricas e estratégias de mercado.
// Regras: TypeScript puro, sem I/O/rede (Injeção de Dependência total),
// resiliência numérica absoluta (jamais NaN/Infinity), divisor seguro.
// Convenção de dados: `PriceDay[]` vem ordenado por data DESC (dia 0 = mais recente),
// como retornado pela GnJoy (priceDetailDayList).

import type {
  ActiveStoreListing,
  MarketAnalysis,
  MarketMetrics,
  MarketStatus,
  PriceDay,
  StrategySuggestion,
} from '@shared/types/domain'
import { THRESHOLDS } from './marketThresholds'

/** Divisão protegida: retorna 0 quando o divisor é 0 (nunca NaN/Infinity). */
function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : safeDivide(sum(values), values.length)
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

// ---------------------------------------------------------------------------
// Métricas primárias
// ---------------------------------------------------------------------------

/**
 * Média Ponderada Real: Σ(avgItemPrice_i × itemCnt_i) / Σ(itemCnt_i) na janela.
 * Ignora distorções de preços surreais (Trolls) ponderando pelo volume.
 */
export function weightedAveragePrice(
  days: PriceDay[],
  window: number = THRESHOLDS.TIMEFRAME_DAYS,
): number {
  const slice = days.slice(0, window)
  let weighted = 0
  let totalQty = 0
  for (const day of slice) {
    weighted += day.avgItemPrice * day.itemCnt
    totalQty += day.itemCnt
  }
  return safeDivide(weighted, totalQty)
}

/** Média de unidades vendidas por dia na janela (volume diário médio). */
export function averageDailyVolume(
  days: PriceDay[],
  window: number = THRESHOLDS.TIMEFRAME_DAYS,
): number {
  const slice = days.slice(0, window)
  return safeDivide(sum(slice.map((d) => d.itemCnt)), slice.length)
}

/** Estoque total à venda agora (soma dos itemCnt das lojas ativas). */
export function totalActiveStock(listings: ActiveStoreListing[]): number {
  return sum(listings.map((l) => l.itemCnt))
}

/** Menor preço entre as lojas ativas (0 se não houver lojas). */
export function lowestActivePrice(listings: ActiveStoreListing[]): number {
  if (listings.length === 0) return 0
  return Math.min(...listings.map((l) => l.itemPrice))
}

/** Maior preço entre as lojas ativas (0 se não houver lojas). */
export function highestActivePrice(listings: ActiveStoreListing[]): number {
  if (listings.length === 0) return 0
  return Math.max(...listings.map((l) => l.itemPrice))
}

/** Spread Atual: maior preço ativo − menor preço ativo. */
export function currentSpread(listings: ActiveStoreListing[]): number {
  if (listings.length === 0) return 0
  return highestActivePrice(listings) - lowestActivePrice(listings)
}

/** Pressão da Concorrência (saturação): estoque ativo / média diária vendida. */
export function competitionPressure(listings: ActiveStoreListing[], days: PriceDay[]): number {
  return safeDivide(totalActiveStock(listings), averageDailyVolume(days))
}

export function computeMetrics(listings: ActiveStoreListing[], days: PriceDay[]): MarketMetrics {
  return {
    weightedAveragePrice: weightedAveragePrice(days),
    currentSpread: currentSpread(listings),
    competitionPressure: competitionPressure(listings, days),
    lowestActivePrice: lowestActivePrice(listings),
  }
}

// ---------------------------------------------------------------------------
// Status de mercado (tags)
// ---------------------------------------------------------------------------

/** Volatilidade intradiária do dia mais recente: (max − min) / min. */
function latestIntradayVolatility(days: PriceDay[]): number {
  const latest = days[0]
  if (!latest || latest.minItemPrice <= 0) return 0
  return (latest.maxItemPrice - latest.minItemPrice) / latest.minItemPrice
}

/**
 * Crash/Dump: último dia fechado com queda de preço > 30% E queda de volume > 50%
 * em relação à média dos 3 dias imediatamente anteriores.
 */
function isCrash(days: PriceDay[]): boolean {
  if (days.length < 4) return false
  const last = days[0]
  const previousThree = days.slice(1, 4)
  const avgPrice3 = mean(previousThree.map((d) => d.avgItemPrice))
  const avgVolume3 = mean(previousThree.map((d) => d.itemCnt))
  if (avgPrice3 === 0 || avgVolume3 === 0) return false
  const priceDrop = (avgPrice3 - last.avgItemPrice) / avgPrice3
  const volumeDrop = (avgVolume3 - last.itemCnt) / avgVolume3
  return (
    priceDrop > THRESHOLDS.CRASH_PRICE_DROP_PCT && volumeDrop > THRESHOLDS.CRASH_VOLUME_DROP_PCT
  )
}

function isStable(listings: ActiveStoreListing[], days: PriceDay[]): boolean {
  const low = lowestActivePrice(listings)
  if (low === 0) return false
  const spreadPct = currentSpread(listings) / low
  return (
    spreadPct < THRESHOLDS.STABLE_THRESHOLD_PCT &&
    latestIntradayVolatility(days) < THRESHOLDS.STABLE_THRESHOLD_PCT
  )
}

export function computeStatuses(listings: ActiveStoreListing[], days: PriceDay[]): MarketStatus[] {
  const statuses: MarketStatus[] = []
  const stock = totalActiveStock(listings)
  const dailyVolume = averageDailyVolume(days)

  if (dailyVolume > 0 && stock < dailyVolume) statuses.push('HOT_ITEM')
  if (dailyVolume > 0 && stock > THRESHOLDS.SATURATED_CP * dailyVolume) statuses.push('SATURATED')
  if (latestIntradayVolatility(days) > THRESHOLDS.VOLATILE_SPREAD_PCT) statuses.push('VOLATILE')
  if (isCrash(days)) statuses.push('CRASH')

  // "Dinheiro Certo": só quando nenhum alerta negativo/positivo disparou.
  if (statuses.length === 0 && isStable(listings, days)) statuses.push('STABLE')

  return statuses
}

// ---------------------------------------------------------------------------
// Estratégias de precificação ativa
// ---------------------------------------------------------------------------

export function computeStrategies(
  listings: ActiveStoreListing[],
  days: PriceDay[],
): StrategySuggestion[] {
  const suggestions: StrategySuggestion[] = []
  if (listings.length === 0) return suggestions

  const dailyVolume = averageDailyVolume(days)
  const minRelevantStock = dailyVolume * THRESHOLDS.UNDERCUT_MIN_STOCK_PCT
  const byPrice = [...listings].sort((a, b) => a.itemPrice - b.itemPrice)
  // Concorrentes válidos: ignora estoque irrisório (< 5% da média diária).
  const validByPrice = byPrice.filter((l) => l.itemCnt >= minRelevantStock)
  const low = lowestActivePrice(listings)
  const weightedAvg3 = weightedAveragePrice(days, THRESHOLDS.RECENT_TIMEFRAME_DAYS)

  // Proteção Flipping (prioritária): mínimo ativo > 30% abaixo da média recente.
  // Sinaliza "Não Vender" e sugere comprar para revender.
  if (weightedAvg3 > 0 && low < (1 - THRESHOLDS.FLIPPING_DISCOUNT_PCT) * weightedAvg3) {
    suggestions.push({
      strategy: 'FLIPPING',
      suggestedPrice: low,
      reason: `Mínimo ativo (${low}) está mais de 30% abaixo da média ponderada de 3 dias (${Math.round(weightedAvg3)}). Não venda — compre para revender.`,
    })
    return suggestions
  }

  const cheapest = byPrice[0]
  const cheapestIsTroll = dailyVolume > 0 && cheapest.itemCnt < minRelevantStock

  // Posicionamento Premium: o mais barato é "troll" (estoque irrisório) =>
  // empata com o concorrente válido mais barato (2º/3º real).
  if (cheapestIsTroll && validByPrice.length > 0) {
    const target = validByPrice[0]
    suggestions.push({
      strategy: 'PREMIUM',
      suggestedPrice: target.itemPrice,
      reason: `O mais barato tem estoque irrisório e esgotará rápido. Alinhe com o concorrente válido mais barato (${target.itemPrice}).`,
    })
  }

  // Undercutting (giro rápido): 1 Zeny abaixo do menor concorrente válido.
  if (validByPrice.length > 0) {
    const target = validByPrice[0]
    suggestions.push({
      strategy: 'UNDERCUTTING',
      suggestedPrice: Math.max(1, target.itemPrice - THRESHOLDS.UNDERCUT_DECREMENT),
      reason: `Precifique 1 Zeny abaixo do menor concorrente válido (${target.itemPrice}).`,
    })
  }

  return suggestions
}

// ---------------------------------------------------------------------------
// Orquestração
// ---------------------------------------------------------------------------

export function analyzeMarket(
  listings: ActiveStoreListing[],
  days: PriceDay[],
  now: Date = new Date(),
): MarketAnalysis {
  return {
    metrics: computeMetrics(listings, days),
    statuses: computeStatuses(listings, days),
    strategies: computeStrategies(listings, days),
    updatedAt: now.toISOString(),
  }
}
