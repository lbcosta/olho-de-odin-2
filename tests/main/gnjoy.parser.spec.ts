// tests/main/gnjoy.parser.spec.ts
import { describe, expect, it } from 'vitest'
import {
  extractActionHash,
  extractChunkPaths,
  parseActionEnvelope,
  parseActiveListings,
  parseHistoricalSummaries,
  parseItemDetail,
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

// Resposta de ação VÁLIDA porém com recurso não encontrado (ex.: ssi expirado)
// — distinta de uma sessão inválida (que não tem envelope `success` nenhum).
const NOT_FOUND_RSC = '0:{"a":"$@1","f":"","b":"x"}\n1:{"success":false}'

// Fallback de página inteira (sessão/hash inválidos) — nenhuma linha de
// nível superior tem a chave `success`.
const FULL_PAGE_FALLBACK = [
  '1:"$Sreact.fragment"',
  '7:{"metadata":[["$","title","0",{"children":"Ragnarok"}]],"error":null,"digest":"$undefined"}',
].join('\n')

// Chunk JS minificado real (trecho) com a chamada que expõe o ID da ação.
const ACTION_CHUNK_JS =
  'var s=a(95155);let c=(0,r.createServerReference)("403371b38682ba2dd997d1b755ba1bb20fadfa07a9",r.callServer,void 0,r.findSourceMapURL,"getDetail");'

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

describe('parseItemDetail (POST item — cartas/encantamentos)', () => {
  const ITEM_RSC =
    '0:{"a":"$@1","f":"","b":"x"}\n' +
    '1:{"data":{"svrId":303,"itemId":1201,"itemName":"Espada","itemPrice":5000,"mapId":835,' +
    '"ssi":"765","itemType":"weapon","itemOptionProperty":null,"randomOpt1":"ATK + 10",' +
    '"randomOpt2":null,"randomOpt3":null,"randomOpt4":null,"slot1":"Carta Poring","slot2":null,' +
    '"slot3":null,"slot4":null,"hasDatabaseItem":true,"databaseImgPath":"x","databaseType":"weapon"},' +
    '"success":true}'

  it('extrai cartas (slots) e encantamentos (randomOpt)', () => {
    const detail = parseItemDetail(ITEM_RSC)
    expect(detail?.slot1).toBe('Carta Poring')
    expect(detail?.randomOpt1).toBe('ATK + 10')
    expect(detail?.itemType).toBe('weapon')
  })

  it('retorna null para sessão inválida (sem envelope)', () => {
    expect(parseItemDetail(FULL_PAGE_FALLBACK)).toBeNull()
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

describe('parseActionEnvelope (Bug #1 — sessão Next-Action)', () => {
  it('success:false COM envelope é distinto de sessão inválida (não é null)', () => {
    const envelope = parseActionEnvelope(NOT_FOUND_RSC)
    expect(envelope).not.toBeNull()
    expect(envelope?.success).toBe(false)
    expect(envelope?.data).toBeNull()
  })

  it('fallback de página inteira (sem envelope) retorna null — sinal de sessão inválida', () => {
    expect(parseActionEnvelope(FULL_PAGE_FALLBACK)).toBeNull()
  })

  it('parseStoreLocation retorna null para success:false sem lançar exceção', () => {
    expect(parseStoreLocation(NOT_FOUND_RSC)).toBeNull()
  })
})

describe('extractChunkPaths (descoberta do Next-Action)', () => {
  it('extrai os caminhos de chunk JS citados na árvore RSC, sem duplicar', () => {
    const raw =
      'f:I[65459,["4166","static/chunks/4166-8f91b73fcd947944.js","5525","static/chunks/5525-29362d0803ac03fd.js"],"default"]\n' +
      '11:I[12,["5525","static/chunks/5525-29362d0803ac03fd.js"],"default"]'
    expect(extractChunkPaths(raw)).toEqual([
      'static/chunks/4166-8f91b73fcd947944.js',
      'static/chunks/5525-29362d0803ac03fd.js',
    ])
  })

  it('retorna lista vazia quando não há chunks', () => {
    expect(extractChunkPaths('1:"$Sreact.fragment"')).toEqual([])
  })
})

describe('extractActionHash (descoberta do Next-Action)', () => {
  it('extrai o ID de Server Action de dentro de `createServerReference(...)`, sem Regex de valor', () => {
    expect(extractActionHash(ACTION_CHUNK_JS)).toBe('403371b38682ba2dd997d1b755ba1bb20fadfa07a9')
  })

  it('não assume comprimento fixo de 40 — aceita IDs de qualquer tamanho hex', () => {
    const js = 'createServerReference("ab12",x)'
    expect(extractActionHash(js)).toBe('ab12')
  })

  it('retorna null quando o chunk não tem a chamada', () => {
    expect(extractActionHash('var x = 1;')).toBeNull()
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
