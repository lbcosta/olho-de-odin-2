// tests/main/gnjoy.parser.spec.ts
import { describe, expect, it } from 'vitest'
import {
  extractNextAction,
  parseActiveListings,
  parseHistoricalSummaries,
  parsePriceHistory,
  parseRscValues,
  parseStoreLocation,
} from '@main/services/gnjoy/parser'

// Fixture de busca (GET trading). Inclui linha de módulo NÃO-JSON (`f:I[...]`)
// e nomes de vendedor com vírgula, parênteses, acento e aspas internas — os
// caracteres que quebrariam qualquer Regex de captura.
const SEARCH_RSC = [
  'f:I[33485,["4166","static/chunks/4166-8f91b73fcd947944.js"],"default"]',
  '1:"$Sreact.fragment"',
  '10:["$","$L12",null,{"queryParams":{"storeType":"BUY","serverType":"NIDHOGG","searchWord":"elixir vermelho"},"list":[{"svrId":303,"itemId":1100003,"mapId":835,"ssi":"7650148185167452340","itemName":"Elixir Vermelho","databaseImgPath":"https://assets/x.png","databaseType":"consumable","storeName":"RODÍZIO LVL 5-8","itemPrice":1400,"itemCnt":6000,"slotMaxCount":"","storeTypeName":"BUY","itemSellerCharName":"No trade, é mais barato (promo)"},{"svrId":303,"itemId":1100003,"mapId":835,"ssi":"7650235888399655364","itemName":"Elixir Vermelho","databaseImgPath":"https://assets/x.png","databaseType":"consumable","storeName":"Loja \\"Aspas\\"","itemPrice":1399,"itemCnt":5000,"slotMaxCount":"","storeTypeName":"BUY","itemSellerCharName":"Dona, Maria (RO)"}],"totalCount":2}]',
].join('\n')

const STORE_RSC = [
  '0:{"a":"$@1","f":"","b":"-EBlZAYMwEznljqiAN2bB"}',
  '1:{"data":{"svrId":303,"svrName":"NIDHOGG","itemId":1100003,"mapId":835,"ssi":"7650148185167452340","storeName":"Consumiveis/Elixir/Hp/Etc","mapName":"prt_mk.gat","itemSellerCharName":"Da.Turca.","itemFullName":"Elixir Vermelho","itemPrice":1400,"marketStoreTypeCode":"BUY","itemCnt":6000,"databaseImgPath":"https://assets/x.png","databaseType":"consumable","xpos":"166","ypos":"146"},"success":true}',
].join('\n')

const PRICE_RSC = [
  '0:{"a":"$@1","f":"","b":"-EBlZAYMwEznljqiAN2bB"}',
  '1:{"data":{"itemPriceMin":1002,"itemPriceMax":9999999,"priceDetailChartList":[{"nowDate":"2026-06-11","minItemPrice":1396,"maxItemPrice":1600,"avgItemPrice":1422}],"priceDetailDayList":[{"nowDate":"2026-06-11","minItemPrice":1396,"maxItemPrice":1600,"avgItemPrice":1422,"itemCnt":16700,"totalCount":31},{"nowDate":"2026-06-10","minItemPrice":1399,"maxItemPrice":1500,"avgItemPrice":1430,"itemCnt":14444,"totalCount":31}]},"success":true}',
].join('\n')

const MARKET_PRICE_RSC =
  '10:["$","$L12",null,{"queryParams":{"serverType":"NIDHOGG"},"list":[{"svrId":303,"itemId":1100003,"mapId":892,"ssi":"7650218064285270433","itemName":"Elixir Vermelho","databaseImgPath":"https://assets/x.png","databaseType":"consumable","totalItemCnt":488542,"minItemPrice":1002,"maxItemPrice":9999999,"avgItemPrice":229042}],"totalCount":1}]'

describe('parseRscValues', () => {
  it('ignora linhas não-JSON (módulos RSC) sem lançar exceção', () => {
    const values = parseRscValues('f:I[33485,["x"],"default"]\n1:"ok"\nlixo sem dois pontos')
    expect(values).toContain('ok')
    // a linha de módulo `I[...]` e a linha sem `:` não entram
    expect(values).toHaveLength(1)
  })
})

describe('parseActiveListings (Anti-Regex)', () => {
  it('extrai todas as lojas ativas da busca', () => {
    const listings = parseActiveListings(SEARCH_RSC)
    expect(listings).toHaveLength(2)
    expect(listings[0].itemPrice).toBe(1400)
    expect(listings[0].ssi).toBe('7650148185167452340')
  })

  it('preserva nomes com vírgula, parênteses, acento e aspas internas', () => {
    const listings = parseActiveListings(SEARCH_RSC)
    expect(listings[0].itemSellerCharName).toBe('No trade, é mais barato (promo)')
    expect(listings[0].storeName).toBe('RODÍZIO LVL 5-8')
    expect(listings[1].storeName).toBe('Loja "Aspas"')
    expect(listings[1].itemSellerCharName).toBe('Dona, Maria (RO)')
  })

  it('retorna lista vazia quando não há linha de resultados', () => {
    expect(parseActiveListings('1:"$Sreact.fragment"')).toEqual([])
  })
})

describe('parseStoreLocation (POST store)', () => {
  it('extrai coordenadas e nome do mapa', () => {
    const store = parseStoreLocation(STORE_RSC)
    expect(store?.xpos).toBe('166')
    expect(store?.ypos).toBe('146')
    expect(store?.mapName).toBe('prt_mk.gat')
  })

  it('é robusto à reordenação das chaves do Next.js (busca por formato)', () => {
    const reordered = '1:{"success":true,"data":{"xpos":"1","ypos":"2","mapName":"x.gat"}}'
    expect(parseStoreLocation(reordered)?.mapName).toBe('x.gat')
  })
})

describe('parsePriceHistory (POST price)', () => {
  it('extrai priceDetailDayList com volume', () => {
    const history = parsePriceHistory(PRICE_RSC)
    expect(history?.priceDetailDayList).toHaveLength(2)
    expect(history?.priceDetailDayList[0].itemCnt).toBe(16700)
    expect(history?.itemPriceMax).toBe(9999999)
  })
})

describe('parseHistoricalSummaries (GET market-price)', () => {
  it('extrai os agregados totais do histórico', () => {
    const summaries = parseHistoricalSummaries(MARKET_PRICE_RSC)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].totalItemCnt).toBe(488542)
    expect(summaries[0].avgItemPrice).toBe(229042)
  })
})

describe('extractNextAction', () => {
  it('captura um hash de Server Action (40 hex) sem Regex', () => {
    const raw = '0:{"action":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"}'
    expect(extractNextAction(raw)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0')
  })

  it('retorna null quando não há hash', () => {
    expect(extractNextAction('1:"$Sreact.fragment"')).toBeNull()
  })
})

describe('desempenho do parser', () => {
  it('processa o payload de busca em menos de 5ms', () => {
    parseActiveListings(SEARCH_RSC) // warm-up
    const start = performance.now()
    parseActiveListings(SEARCH_RSC)
    expect(performance.now() - start).toBeLessThan(5)
  })
})
