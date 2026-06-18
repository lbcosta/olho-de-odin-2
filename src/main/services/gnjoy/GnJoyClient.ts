// src/main/services/gnjoy/GnJoyClient.ts
// Orquestrador de rede da GnJoy: amarra a Fila Global, o Parser Anti-Regex e a
// descoberta da Server Action `Next-Action`. Toda chamada passa pelo
// RequestQueueManager (rate limit de 3000ms). `fetch` é injetável para testes.
//
// Sessão real da GnJoy (confirmada por captura ao vivo da API):
//  - O ID `Next-Action` NÃO vem no corpo RSC do GET — é uma constante de build
//    embutida num chunk JS da página, via `createServerReference("<id>", ...)`.
//  - Há UMA ÚNICA Server Action compartilhada para store/item/price (despacho
//    interno por `params.type`); não há um hash por rota.
//  - Descoberta: localiza os chunks (`static/chunks/*.js`) citados no corpo RSC
//    do GET mais recente, busca cada um até achar a chamada, e cacheia o hash
//    (estável até o próximo deploy do site).
//  - Auto-renew: se o POST cair no fallback de página inteira (sem envelope de
//    ação), descarta o hash cacheado, refaz o GET e tenta o POST novamente.

import type { RequestPriority } from '@shared/types/domain'
import { RequestQueueManager } from './RequestQueueManager'
import { GNJOY_BASE_URL, type GnJoyEndpoint } from './endpoints'
import { extractActionHash, extractChunkPaths, parseActionEnvelope } from './parser'

export interface FetchInit {
  method?: string
  headers?: Record<string, string>
  body?: string
}
export interface FetchResponse {
  ok: boolean
  status: number
  text(): Promise<string>
}
export type FetchLike = (url: string, init?: FetchInit) => Promise<FetchResponse>

export class GnJoyError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message)
    this.name = 'GnJoyError'
  }
}

/** POST caiu no fallback de página inteira — hash `Next-Action` inválido/expirado. */
export class StaleSessionError extends GnJoyError {
  constructor(message = 'Sessão Next-Action expirada (resposta sem envelope de ação).') {
    super(message, null)
    this.name = 'StaleSessionError'
  }
}

export class GnJoyClient {
  private actionHash: string | null = null
  private lastGetEndpoint: GnJoyEndpoint | null = null
  private renewing: Promise<void> | null = null

  constructor(
    private readonly queue: RequestQueueManager = RequestQueueManager.getInstance(),
    private readonly fetchImpl: FetchLike = fetch as unknown as FetchLike,
  ) {}

  /** Executa um GET (RSC) e guarda o endpoint p/ eventual renovação da sessão. */
  get(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    return this.enqueueGet(endpoint, priority)
  }

  /** Executa um POST (Server Action), garantindo o hash e com auto-renew em falha. */
  async post(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    await this.ensureActionHash(priority)
    try {
      return await this.enqueuePost(endpoint, priority)
    } catch (error) {
      if (!(error instanceof GnJoyError)) throw error
      await this.renewSession(priority)
      try {
        return await this.enqueuePost(endpoint, priority)
      } catch (retryError) {
        if (retryError instanceof GnJoyError) {
          throw new GnJoyError('Falha ao renovar a sessão Next-Action.')
        }
        throw retryError
      }
    }
  }

  /** Hash de Server Action descoberto (volátil). Exposto p/ diagnóstico/testes. */
  get currentActionHash(): string | null {
    return this.actionHash
  }

  private async ensureActionHash(priority: RequestPriority): Promise<void> {
    if (this.actionHash) return
    await this.renewSession(priority)
  }

  /** Refaz o último GET e redescobre o hash (dedupe entre chamadas concorrentes). */
  private renewSession(priority: RequestPriority): Promise<void> {
    if (!this.renewing) {
      this.renewing = this.doRenewSession(priority).finally(() => {
        this.renewing = null
      })
    }
    return this.renewing
  }

  private async doRenewSession(priority: RequestPriority): Promise<void> {
    const endpoint = this.lastGetEndpoint
    if (!endpoint) {
      throw new GnJoyError('Sem GET prévio para estabelecer a sessão da GnJoy.')
    }
    this.actionHash = null
    await this.enqueueGet(endpoint, priority, 'renew')
  }

  // IMPORTANTE: a descoberta do hash (que enfileira buscas de chunk) só pode
  // acontecer DEPOIS que a promessa do GET resolver — a fila é de execução
  // única (não-reentrante); enfileirar de DENTRO da task de outro job trava
  // a fila (a task nunca termina, então o job do chunk nunca é processado).
  private async enqueueGet(
    endpoint: GnJoyEndpoint,
    priority: RequestPriority,
    kind: 'get' | 'renew' = 'get',
  ): Promise<string> {
    const text = await this.queue.enqueue(() => this.rawGet(endpoint), {
      method: 'GET',
      path: kind === 'renew' ? `renew:${endpoint.path}` : endpoint.path,
      humanAction: kind === 'renew' ? 'Renovando sessão...' : endpoint.humanAction,
      priority,
    })
    this.lastGetEndpoint = endpoint
    if (!this.actionHash) {
      this.actionHash = await this.discoverActionHash(text, priority)
    }
    return text
  }

  private enqueuePost(endpoint: GnJoyEndpoint, priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(
      async () => {
        const text = await this.rawPost(endpoint)
        // Fallback de página inteira (sem envelope) lançado AQUI para que a
        // fila o LOGUE como ERROR — senão o app mostraria "200" silencioso.
        if (parseActionEnvelope(text) === null) throw new StaleSessionError()
        return text
      },
      { method: 'POST', path: endpoint.path, humanAction: endpoint.humanAction, priority },
    )
  }

  private async rawGet(endpoint: GnJoyEndpoint): Promise<string> {
    const res = await this.fetchImpl(endpoint.url, { method: 'GET', headers: { RSC: '1' } })
    if (!res.ok) throw new GnJoyError(`GET falhou (${res.status})`, res.status)
    return res.text()
  }

  private async rawPost(endpoint: GnJoyEndpoint): Promise<string> {
    const res = await this.fetchImpl(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/x-component',
        'Next-Action': this.actionHash ?? '',
      },
      body: JSON.stringify(endpoint.payload),
    })
    if (!res.ok) throw new GnJoyError(`POST falhou (${res.status})`, res.status)
    return res.text()
  }

  /** Varre os chunks JS referenciados pela página até achar a Server Action. */
  private async discoverActionHash(
    getBody: string,
    priority: RequestPriority,
  ): Promise<string | null> {
    for (const chunkPath of extractChunkPaths(getBody)) {
      const js = await this.fetchChunk(chunkPath, priority)
      const hash = js ? extractActionHash(js) : null
      if (hash) return hash
    }
    return null
  }

  private fetchChunk(chunkPath: string, priority: RequestPriority): Promise<string | null> {
    return this.queue.enqueue(
      async () => {
        const res = await this.fetchImpl(`${GNJOY_BASE_URL}/_next/${chunkPath}`, {
          method: 'GET',
        })
        return res.ok ? res.text() : null
      },
      {
        method: 'GET',
        path: `asset:${chunkPath}`,
        humanAction: 'Descobrindo sessão da GnJoy...',
        priority,
      },
    )
  }
}
