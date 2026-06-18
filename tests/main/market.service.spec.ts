// tests/main/market.service.spec.ts
// Regressão do fluxo de sincronização do item (Bug 1 + Bug 2): o histórico
// detalhado é uma Server Action da página `market-price`, então o syncItem
// precisa visitar (GET) essa MESMA página antes do POST de preço — caso
// contrário o hash Next-Action da busca em `trading` invalida o POST, o
// auto-renew reabre a página errada ("Falha ao renovar a sessão Next-Action")
// e a Média Ponderada fica zerada por falta de histórico.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type DatabaseConnection } from '@main/database'
import { applySchema } from '@main/database/migrate'
import { ProfileService } from '@main/services/profile/ProfileService'
import { CacheService } from '@main/services/cache/CacheService'
import { RequestQueueManager } from '@main/services/gnjoy/RequestQueueManager'
import { GnJoyClient, type FetchLike } from '@main/services/gnjoy/GnJoyClient'
import { MarketService } from '@main/services/market/MarketService'

interface ScriptedResponse {
  ok?: boolean
  status?: number
  body: string
}

function mockFetch(responses: Array<string | ScriptedResponse>) {
  const calls: Array<{ url: string; headers: Record<string, string>; method: string }> = []
  const impl: FetchLike = async (url, init) => {
    calls.push({ url, headers: init?.headers ?? {}, method: init?.method ?? 'GET' })
    const raw = responses.shift() ?? { body: '' }
    const r: ScriptedResponse = typeof raw === 'string' ? { body: raw } : raw
    return { ok: r.ok ?? true, status: r.status ?? 200, text: async () => r.body }
  }
  return { impl, calls }
}

const ITEM_ID = 1100003
const HASH_TRADING = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
const HASH_MARKET = 'f0e1d2c3b4a5968778695a4b3c2d1e0f00112233'

// GET trading: hash da página `trading` + 1 loja ativa do item.
const SEARCH_RSC = [
  `0:{"a":"${HASH_TRADING}"}`,
  `10:["$","$L12",null,{"queryParams":{"serverType":"NIDHOGG"},"list":[{"svrId":303,"itemId":${ITEM_ID},"mapId":835,"ssi":"7650148185167452340","itemName":"Elixir Vermelho","databaseImgPath":"x.png","databaseType":"consumable","storeName":"Loja","itemPrice":1400,"itemCnt":6000,"slotMaxCount":"","storeTypeName":"SELL","itemSellerCharName":"Vendedor"}],"totalCount":1}]`,
].join('\n')

// GET market-price: hash da página `market-price` (diferente do de trading).
const MARKET_GET_RSC = `0:{"a":"${HASH_MARKET}"}`

// POST market-price: histórico detalhado com volume (alimenta a Média Ponderada).
const PRICE_RSC =
  '1:{"data":{"itemPriceMin":1002,"itemPriceMax":9999999,"priceDetailChartList":[],"priceDetailDayList":[{"nowDate":"2026-06-11","minItemPrice":1396,"maxItemPrice":1600,"avgItemPrice":1422,"itemCnt":16700,"totalCount":31},{"nowDate":"2026-06-10","minItemPrice":1399,"maxItemPrice":1500,"avgItemPrice":1430,"itemCnt":14444,"totalCount":31}]},"success":true}'

const INVALID_POST = '<html>200 sem dados de acao</html>'

let db: DatabaseConnection
let profiles: ProfileService
let cache: CacheService

beforeEach(() => {
  db = createDatabase(':memory:')
  applySchema(db)
  profiles = new ProfileService(db)
  cache = new CacheService(db)
  profiles.registerItem({ itemId: ITEM_ID, name: 'Elixir Vermelho', type: 'consumable' })
  RequestQueueManager.__resetForTests()
  RequestQueueManager.getInstance(0) // sem cooldown nos testes
})

afterEach(() => {
  RequestQueueManager.__resetForTests()
  db.close()
})

function buildService(impl: FetchLike): MarketService {
  const queue = RequestQueueManager.getInstance()
  const client = new GnJoyClient(queue, impl)
  return new MarketService(queue, client, cache, profiles)
}

describe('MarketService.syncItem — sessão do histórico (Bug 1 + Bug 2)', () => {
  it('visita market-price (GET) antes do POST de preço e popula a Média Ponderada', async () => {
    const { impl, calls } = mockFetch([SEARCH_RSC, MARKET_GET_RSC, PRICE_RSC])
    const market = buildService(impl)

    const details = await market.syncItem(ITEM_ID, 'NIDHOGG')

    // Sequência correta: GET trading -> GET market-price -> POST market-price.
    expect(calls.map((c) => c.method)).toEqual(['GET', 'GET', 'POST'])
    expect(calls[0].url).toContain('shop-search/trading')
    expect(calls[1].url).toContain('shop-search/market-price')
    expect(calls[2].method).toBe('POST')
    expect(calls[2].url).toContain('shop-search/market-price')
    // O POST usa o hash da página market-price (não o de trading).
    expect(calls[2].headers['Next-Action']).toBe(HASH_MARKET)

    // Bug 2: a Média Ponderada deixa de ser 0 quando o histórico chega.
    expect(details.analysis?.metrics.weightedAveragePrice).toBeGreaterThan(0)
  })

  it('auto-renova o histórico contra a página market-price (não trading)', async () => {
    const { impl, calls } = mockFetch([
      SEARCH_RSC, // GET trading
      MARKET_GET_RSC, // GET market-price (sessão correta)
      INVALID_POST, // POST #1: hash expirou
      MARKET_GET_RSC, // renew: deve reabrir market-price, NÃO trading
      PRICE_RSC, // POST #2: ok
    ])
    const market = buildService(impl)

    const details = await market.syncItem(ITEM_ID, 'NIDHOGG')

    // A renovação (call[3]) é um GET na MESMA página do POST (market-price).
    expect(calls[3].method).toBe('GET')
    expect(calls[3].url).toContain('shop-search/market-price')
    expect(calls[3].url).toBe(calls[1].url)
    expect(details.analysis?.metrics.weightedAveragePrice).toBeGreaterThan(0)
  })
})
