// tests/main/gnjoy.client.spec.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RequestQueueManager } from '@main/services/gnjoy/RequestQueueManager'
import { GnJoyClient, type FetchLike } from '@main/services/gnjoy/GnJoyClient'
import { searchActiveEndpoint, storeLocationEndpoint } from '@main/services/gnjoy/endpoints'
import { parseStoreLocation } from '@main/services/gnjoy/parser'

interface ScriptedResponse {
  ok?: boolean
  status?: number
  body: string
}

function mockFetch(responses: ScriptedResponse[]) {
  const calls: Array<{ url: string; headers: Record<string, string>; method: string }> = []
  const impl: FetchLike = async (url, init) => {
    calls.push({ url, headers: init?.headers ?? {}, method: init?.method ?? 'GET' })
    const r = responses.shift() ?? { body: '' }
    return { ok: r.ok ?? true, status: r.status ?? 200, text: async () => r.body }
  }
  return { impl, calls }
}

const HASH1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
const HASH2 = 'f0e1d2c3b4a5968778695a4b3c2d1e0f00112233'
const SEARCH = searchActiveEndpoint({
  searchWord: 'elixir',
  serverType: 'NIDHOGG',
  storeType: 'BUY',
})
const STORE = storeLocationEndpoint({ svrId: 303, mapId: 835, ssi: '7650148185167452340' })
const VALID_STORE = '1:{"data":{"xpos":"166","ypos":"146","mapName":"prt_mk.gat"},"success":true}'

beforeEach(() => {
  RequestQueueManager.__resetForTests()
  RequestQueueManager.getInstance(0) // cooldown 0 nos testes (sem espera)
})
afterEach(() => {
  RequestQueueManager.__resetForTests()
})

describe('GnJoyClient — sessão Next-Action', () => {
  it('captura o hash no GET e injeta no header do POST', async () => {
    const { impl, calls } = mockFetch([{ body: `0:{"k":"${HASH1}"}` }, { body: VALID_STORE }])
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(client.currentNextAction).toBe(HASH1)
    expect(calls[1].method).toBe('POST')
    expect(calls[1].headers['Next-Action']).toBe(HASH1)
    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
  })

  it('auto-renova quando o POST volta sem dados de ação (hash expirado)', async () => {
    const { impl, calls } = mockFetch([
      { body: `0:{"k":"${HASH1}"}` }, // GET inicial -> HASH1
      { body: '<html>expired</html>' }, // POST #1 inválido
      { body: `0:{"k":"${HASH2}"}` }, // renew GET -> HASH2
      { body: VALID_STORE }, // POST #2 válido
    ])
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
    expect(client.currentNextAction).toBe(HASH2)
    expect(calls).toHaveLength(4)
    expect(calls[1].headers['Next-Action']).toBe(HASH1) // 1ª tentativa
    expect(calls[3].headers['Next-Action']).toBe(HASH2) // após renovação
  })

  it('auto-renova quando o POST falha por status HTTP', async () => {
    const { impl, calls } = mockFetch([
      { body: `0:{"k":"${HASH1}"}` },
      { ok: false, status: 500, body: '' }, // POST #1 falha
      { body: `0:{"k":"${HASH2}"}` }, // renew
      { body: VALID_STORE }, // POST #2 ok
    ])
    const client = new GnJoyClient(RequestQueueManager.getInstance(), impl)

    await client.get(SEARCH)
    const text = await client.post(STORE)

    expect(parseStoreLocation(text)?.mapName).toBe('prt_mk.gat')
    expect(calls).toHaveLength(4)
  })
})
