// src/main/services/gnjoy/GnJoyClient.ts
// Orquestrador de rede da GnJoy: amarra a Fila Global, o Parser Anti-Regex e a
// sessão dinâmica `Next-Action`. Toda chamada passa pelo RequestQueueManager
// (rate limit de 3000ms). `fetch` é injetável para testes.
//
// Sessão Next-Action:
//  - GET captura o hash do corpo RSC e o persiste de forma volátil.
//  - POST injeta o hash no header `Next-Action`.
//  - Auto-renew: se o POST volta sem dados de ação (hash expirado), o client
//    re-emite o último GET (prioridade alta) e repete o POST uma vez.

import type { RequestPriority } from '@shared/types/domain'
import { RequestQueueManager } from './RequestQueueManager'
import type { GnJoyEndpoint } from './endpoints'
import { extractNextAction, parseActionData } from './parser'

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

export class GnJoyClient {
  private nextAction: string | null = null
  private lastGetUrl: string | null = null

  constructor(
    private readonly queue: RequestQueueManager = RequestQueueManager.getInstance(),
    private readonly fetchImpl: FetchLike = fetch as unknown as FetchLike,
  ) {}

  /** Executa um GET (RSC) e captura o hash Next-Action do corpo. */
  get(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    return this.queue.enqueue(
      async () => {
        const text = await this.rawGet(endpoint.url)
        return text
      },
      { method: 'GET', path: endpoint.path, humanAction: endpoint.humanAction, priority },
    )
  }

  /** Executa um POST (Server Action) com auto-renew do Next-Action. */
  async post(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    try {
      const text = await this.enqueuePost(endpoint, priority)
      if (parseActionData(text) !== null) return text
      // Resposta OK porém sem dados de ação → provável hash expirado.
    } catch (error) {
      if (!this.lastGetUrl) throw error
    }

    if (!this.lastGetUrl) {
      throw new GnJoyError('Resposta inválida e sem GET prévio para renovar a sessão.')
    }

    // Auto-renew: refaz o GET (atualiza Next-Action) e repete o POST uma vez.
    await this.enqueueRenew(priority)
    const retry = await this.enqueuePost(endpoint, priority)
    if (parseActionData(retry) === null) {
      throw new GnJoyError('Falha ao renovar a sessão Next-Action.')
    }
    return retry
  }

  /** Hash Next-Action atual (volátil). Exposto para diagnóstico/testes. */
  get currentNextAction(): string | null {
    return this.nextAction
  }

  private enqueuePost(endpoint: GnJoyEndpoint, priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(() => this.rawPost(endpoint), {
      method: 'POST',
      path: endpoint.path,
      humanAction: endpoint.humanAction,
      priority,
    })
  }

  private enqueueRenew(priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(() => this.rawGet(this.lastGetUrl as string), {
      method: 'GET',
      path: 'renew:next-action',
      humanAction: 'Renovando sessão...',
      priority,
    })
  }

  private async rawGet(url: string): Promise<string> {
    const res = await this.fetchImpl(url, { method: 'GET', headers: { RSC: '1' } })
    if (!res.ok) throw new GnJoyError(`GET falhou (${res.status})`, res.status)
    const text = await res.text()
    const hash = extractNextAction(text)
    if (hash) this.nextAction = hash
    this.lastGetUrl = url
    return text
  }

  private async rawPost(endpoint: GnJoyEndpoint): Promise<string> {
    const res = await this.fetchImpl(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/x-component',
        'Next-Action': this.nextAction ?? '',
      },
      body: JSON.stringify(endpoint.payload),
    })
    if (!res.ok) throw new GnJoyError(`POST falhou (${res.status})`, res.status)
    return res.text()
  }
}
