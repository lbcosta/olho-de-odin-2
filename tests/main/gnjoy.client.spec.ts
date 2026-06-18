// tests/main/gnjoy.client.spec.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { RequestLogEntry } from '@shared/types/domain'
import { RequestQueueManager } from '@main/services/gnjoy/RequestQueueManager'
import { GnJoyClient, type FetchLike } from '@main/services/gnjoy/GnJoyClient'
import {
  priceHistoryEndpoint,
  searchActiveEndpoint,
  storeLocationEndpoint,
} from '@main/services/gnjoy/endpoints'
import { parsePriceHistory, parseStoreLocation } from '@main/services/gnjoy/parser'

interface ScriptedResponse {
  ok?: boolean
  status?: number
  body: string
}

/**
 * Mock com três filas independentes — espelha a topologia real: GET de página
 * (RSC), GET de chunk estático (`/_next/...`, onde mora o hash da Server
 * Action) e POST (a própria ação).
 */
function mockFetch(opts: {
  pages?: ScriptedResponse[]
  chunks?: ScriptedResponse[]
  posts?: ScriptedResponse[]
}) {
  const pages = [...(opts.pages ?? [])]
  const chunks = [...(opts.chunks ?? [])]
  const posts = [...(opts.posts ?? [])]
  const calls: Array<{ url: string; headers: Record<string, string>; method: string }> = []
  const impl: FetchLike = async (url, init) => {
    const method = init?.method ?? 'GET'
    calls.push({ url, headers: init?.headers ?? {}, method })
    let r: ScriptedResponse | undefined
    if (method === 'POST') r = posts.shift()
    else if (url.includes('/_next/')) r = chunks.shift()
    else r = pages.shift()
    r ??= { body: '' }
    return { ok: r.ok ?? true, status: r.status ?? 200, text: async () => r.body }
  }
  return { impl, calls }
}

// Hashes reais de Server Action têm comprimento VARIÁVEL (não 40 fixo) — ver Bug #1.
const HASH1 = '403371b38682ba2dd997d1b755ba1bb20fadfa07a9'
const HASH2 = 'aa11bb22cc33dd44ee55ff66aa11bb22cc33dd44ee'

const CHUNK_PATH = 'static/chunks/c1-aaa.js'
// Corpo RSC de uma página real: o hash NÃO está aqui, só a referência ao chunk.
const PAGE_WITH_CHUNK = [
  `f:I[1,["c1","${CHUNK_PATH}"],"default"]`,
  '10:["$","$L1",null,{"queryParams":{},"list":[],"totalCount":0}]',
].join('\n')
const chunkJsWith = (hash: string): string =>
  `(0,r.createServerReference)("${hash}",r.callServer,void 0,r.findSourceMapURL,"getDetail")`

const SEARCH = searchActiveEndpoint({
  searchWord: 'elixir',
  serverType: 'NIDHOGG',
  storeType: 'BUY',
})
const STORE = storeLocationEndpoint({ svrId: 303, mapId: 835, ssi: '7650148185167452340' })
const VALID_STORE =
  '0:{"a":"$@1","f":"","b":"x"}\n1:{"data":{"xpos":"166","ypos":"146","mapName":"prt_mk.gat"},"success":true}'
const NOT_FOUND = '0:{"a":"$@1","f":"","b":"x"}\n1:{"success":false}'
const PRICE_OK =
  '1:{"data":{"itemPriceMin":1,"itemPriceMax":9,"priceDetailChartList":[],' +
  '"priceDetailDayList":[{"nowDate":"2026-06-18","minItemPrice":5,"maxItemPrice":9,' +
  '"avgItemPrice":7,"itemCnt":3,"totalCount":3}]},"success":true}'

beforeEach(() => {
  RequestQueueManager.__resetForTests()
  RequestQueueManager.getInstance(0) // cooldown 0 nos testes (sem espera)
})
afterEach(() => {
  RequestQueueManager.__resetForTests()
})

describe('GnJoyClient — descoberta do Next-Action via chunk JS (Bug #1)', () => {
  it('descobre o hash no chunk JS (não no corpo RSC) e injeta no header do POST', async () => {
    const { impl, calls } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }],
      posts: [{ body: VALID_STORE }],
    })
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(client.currentActionHash).toBe(HASH1)
    const postCall = calls.find((c) => c.method === 'POST')
    expect(postCall?.headers['Next-Action']).toBe(HASH1)
    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
  })

  it('priceHistoryEndpoint posta na rota trading (ação compartilhada — Bug #1)', async () => {
    const { impl, calls } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }],
      posts: [{ body: PRICE_OK }],
    })
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(priceHistoryEndpoint({ itemId: 501, svrId: 303 }))

    const postCall = calls.find((c) => c.method === 'POST')
    expect(postCall?.url).toContain('/trading')
    expect(postCall?.url).not.toContain('/market-price')
    expect(parsePriceHistory(text)?.priceDetailDayList).toHaveLength(1)
  })

  it('success:false (recurso não encontrado, ex.: ssi expirado) NÃO dispara renovação', async () => {
    const { impl, calls } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }],
      posts: [{ body: NOT_FOUND }],
    })
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(parseStoreLocation(text)).toBeNull()
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1)
  })

  it('auto-renova quando o POST cai no fallback de página inteira (hash inválido)', async () => {
    const { impl, calls } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }, { body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }, { body: chunkJsWith(HASH2) }],
      posts: [{ body: PAGE_WITH_CHUNK }, { body: VALID_STORE }],
    })
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
    expect(client.currentActionHash).toBe(HASH2)
    const postCalls = calls.filter((c) => c.method === 'POST')
    expect(postCalls).toHaveLength(2)
    expect(postCalls[0].headers['Next-Action']).toBe(HASH1)
    expect(postCalls[1].headers['Next-Action']).toBe(HASH2)
  })

  it('auto-renova quando o POST falha por status HTTP', async () => {
    const { impl, calls } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }, { body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }, { body: chunkJsWith(HASH2) }],
      posts: [{ ok: false, status: 500, body: '' }, { body: VALID_STORE }],
    })
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(2)
  })

  it('falha definitiva (ambas tentativas inválidas) lança erro claro e é LOGADA como ERROR', async () => {
    const logs: RequestLogEntry[] = []
    const queue = RequestQueueManager.getInstance()
    queue.on('log', (e) => logs.push(e))
    const { impl } = mockFetch({
      pages: [{ body: PAGE_WITH_CHUNK }, { body: PAGE_WITH_CHUNK }],
      chunks: [{ body: chunkJsWith(HASH1) }, { body: chunkJsWith(HASH2) }],
      posts: [{ body: PAGE_WITH_CHUNK }, { body: PAGE_WITH_CHUNK }],
    })
    const client = new GnJoyClient(queue, impl)

    await client.get(SEARCH)
    await expect(client.post(STORE)).rejects.toThrow('Falha ao renovar a sessão Next-Action.')

    const postErrors = logs.filter((l) => l.method === 'POST' && l.status === 'ERROR')
    expect(postErrors.length).toBeGreaterThanOrEqual(1)
  })

  it('lança erro claro quando não há GET prévio para estabelecer a sessão', async () => {
    const { impl } = mockFetch({})
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await expect(client.post(STORE)).rejects.toThrow('Sem GET prévio')
  })
})
