// tests/main/metrics.spec.ts
import { describe, expect, it } from 'vitest'
import type { ActiveStoreListing, PriceDay } from '@shared/types/domain'
import {
  analyzeMarket,
  averageDailyVolume,
  competitionPressure,
  computeStatuses,
  computeStrategies,
  currentSpread,
  weightedAveragePrice,
} from '@main/services/metrics/SalesMetrics'

function listing(overrides: Partial<ActiveStoreListing> = {}): ActiveStoreListing {
  return {
    svrId: 303,
    itemId: 1100003,
    mapId: 835,
    ssi: 'ssi',
    itemName: 'Elixir Vermelho',
    databaseImgPath: '',
    databaseType: 'consumable',
    storeName: 'Loja',
    itemPrice: 100,
    itemCnt: 1000,
    slotMaxCount: '',
    storeTypeName: 'SELL',
    itemSellerCharName: 'Vendedor',
    ...overrides,
  }
}

function day(overrides: Partial<PriceDay> = {}): PriceDay {
  return {
    nowDate: '2026-06-11',
    minItemPrice: 100,
    maxItemPrice: 110,
    avgItemPrice: 105,
    itemCnt: 10000,
    totalCount: 30,
    ...overrides,
  }
}

/** 7 dias estáveis: avg=105, volume diário=10000. */
function stableDays(): PriceDay[] {
  return Array.from({ length: 7 }, () => day())
}

describe('weightedAveragePrice', () => {
  it('pondera o preço pelo volume de cada dia', () => {
    const days = [
      day({ avgItemPrice: 100, itemCnt: 100 }),
      day({ avgItemPrice: 200, itemCnt: 300 }),
    ]
    // (100*100 + 200*300) / (100+300) = 70000/400 = 175
    expect(weightedAveragePrice(days)).toBe(175)
  })

  it('retorna 0 (sem NaN/Infinity) quando itemCnt total é 0', () => {
    const days = [day({ itemCnt: 0 }), day({ itemCnt: 0 })]
    const result = weightedAveragePrice(days)
    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('retorna 0 para histórico vazio', () => {
    expect(weightedAveragePrice([])).toBe(0)
  })

  it('respeita a janela móvel (apenas os N dias mais recentes)', () => {
    const days = [
      day({ avgItemPrice: 100, itemCnt: 10 }),
      day({ avgItemPrice: 100, itemCnt: 10 }),
      day({ avgItemPrice: 9999, itemCnt: 10 }), // fora da janela de 2 dias
    ]
    expect(weightedAveragePrice(days, 2)).toBe(100)
  })
})

describe('métricas primárias', () => {
  it('currentSpread = maior − menor preço ativo', () => {
    const listings = [
      listing({ itemPrice: 100 }),
      listing({ itemPrice: 150 }),
      listing({ itemPrice: 120 }),
    ]
    expect(currentSpread(listings)).toBe(50)
  })

  it('currentSpread = 0 sem lojas ativas', () => {
    expect(currentSpread([])).toBe(0)
  })

  it('competitionPressure usa divisor seguro (sem histórico => 0)', () => {
    const result = competitionPressure([listing({ itemCnt: 500 })], [])
    expect(result).toBe(0)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('averageDailyVolume calcula a média diária da janela', () => {
    expect(averageDailyVolume([day({ itemCnt: 1000 }), day({ itemCnt: 3000 })])).toBe(2000)
  })
})

describe('computeStatuses (thresholds)', () => {
  it('HOT_ITEM quando estoque ativo < média diária', () => {
    const listings = [listing({ itemCnt: 500 })] // 500 < 10000
    expect(computeStatuses(listings, stableDays())).toContain('HOT_ITEM')
  })

  it('SATURATED quando estoque ativo > 150% da média diária', () => {
    const listings = [listing({ itemCnt: 16000 })] // 16000 > 1.5*10000
    expect(computeStatuses(listings, stableDays())).toContain('SATURATED')
  })

  it('VOLATILE quando o intradiário (max-min)/min do dia mais recente > 30%', () => {
    const days = [day({ minItemPrice: 100, maxItemPrice: 140 }), ...stableDays()]
    expect(computeStatuses([listing()], days)).toContain('VOLATILE')
  })

  it('CRASH quando preço cai >30% e volume cai >50% vs média dos 3 dias anteriores', () => {
    const days = [
      day({ avgItemPrice: 50, itemCnt: 1000 }), // hoje: -52% preço, -90% volume
      day({ avgItemPrice: 100, itemCnt: 10000 }),
      day({ avgItemPrice: 100, itemCnt: 10000 }),
      day({ avgItemPrice: 105, itemCnt: 10000 }),
    ]
    expect(computeStatuses([listing({ itemCnt: 12000 })], days)).toContain('CRASH')
  })

  it('STABLE quando spread e volatilidade < 10% e sem outros alertas', () => {
    const listings = [
      listing({ itemPrice: 100, itemCnt: 6000 }),
      listing({ itemPrice: 105, itemCnt: 6000 }),
    ]
    // estoque total 12000 (entre 10000 e 15000) => nem HOT nem SATURATED
    const days = Array.from({ length: 7 }, () => day({ minItemPrice: 100, maxItemPrice: 105 }))
    expect(computeStatuses(listings, days)).toEqual(['STABLE'])
  })
})

describe('computeStrategies', () => {
  it('UNDERCUTTING sugere 1 Zeny abaixo do menor concorrente válido', () => {
    const listings = [
      listing({ itemPrice: 100, itemCnt: 1000 }),
      listing({ itemPrice: 120, itemCnt: 2000 }),
    ]
    const strategies = computeStrategies(listings, stableDays())
    const undercut = strategies.find((s) => s.strategy === 'UNDERCUTTING')
    expect(undercut?.suggestedPrice).toBe(99)
  })

  it('ignora lojas "troll" (estoque < 5% da média diária) e sugere PREMIUM', () => {
    // média diária 10000 => limiar 500. Troll com 100 de estoque é ignorado.
    const listings = [
      listing({ itemPrice: 98, itemCnt: 100 }), // troll: mais barato porém estoque irrisório
      listing({ itemPrice: 100, itemCnt: 1000 }), // concorrente válido mais barato
      listing({ itemPrice: 110, itemCnt: 1000 }),
    ]
    const strategies = computeStrategies(listings, stableDays())
    const premium = strategies.find((s) => s.strategy === 'PREMIUM')
    const undercut = strategies.find((s) => s.strategy === 'UNDERCUTTING')
    expect(premium?.suggestedPrice).toBe(100) // empata com o válido mais barato
    expect(undercut?.suggestedPrice).toBe(99) // undercut também ignora o troll
  })

  it('FLIPPING quando o mínimo ativo está >30% abaixo da média ponderada recente', () => {
    // wAvg(3 dias) = 100; mínimo ativo = 60 (−40%) => Comprar
    const days = Array.from({ length: 7 }, () => day({ avgItemPrice: 100, itemCnt: 10000 }))
    const listings = [
      listing({ itemPrice: 60, itemCnt: 1000 }),
      listing({ itemPrice: 100, itemCnt: 1000 }),
    ]
    const strategies = computeStrategies(listings, days)
    expect(strategies).toHaveLength(1)
    expect(strategies[0].strategy).toBe('FLIPPING')
    expect(strategies[0].suggestedPrice).toBe(60)
  })

  it('não sugere nada sem lojas ativas (sem crash)', () => {
    expect(computeStrategies([], stableDays())).toEqual([])
  })
})

describe('resiliência e desempenho', () => {
  it('analyzeMarket nunca produz NaN/Infinity, mesmo com entradas vazias', () => {
    const analysis = analyzeMarket([], [])
    for (const value of Object.values(analysis.metrics)) {
      expect(Number.isFinite(value)).toBe(true)
    }
    expect(analysis.statuses).toEqual([])
    expect(analysis.strategies).toEqual([])
  })

  it('processa 2000 dias + 2000 lojas em menos de 20ms', () => {
    const days = Array.from({ length: 2000 }, (_, i) =>
      day({ avgItemPrice: 100 + (i % 50), itemCnt: 5000 + i }),
    )
    const listings = Array.from({ length: 2000 }, (_, i) =>
      listing({ itemPrice: 90 + (i % 40), itemCnt: 100 + i }),
    )
    analyzeMarket(listings, days) // warm-up (JIT)
    const start = performance.now()
    analyzeMarket(listings, days)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(20)
  })
})
