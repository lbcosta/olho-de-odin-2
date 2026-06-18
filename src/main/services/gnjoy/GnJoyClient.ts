// src/main/services/gnjoy/GnJoyClient.ts
// Orquestrador de rede da GnJoy: amarra a Fila Global, o Parser Anti-Regex e a
// sessão dinâmica `Next-Action`. Toda chamada passa pelo RequestQueueManager
// (rate limit de 3000ms). `fetch` é injetável para testes.
//
// Sessão Next-Action POR ROTA:
//  - O hash é um Server Action ID do Next.js amarrado a uma PÁGINA. Um POST só
//    é válido com o hash capturado num GET DA MESMA rota (pathname).
//  - GET captura o hash do corpo RSC e o guarda sob a sua rota.
//  - POST garante o hash da sua rota (executa o `priming` GET quando ausente),
//    injeta-o no header `Next-Action` e valida os dados de ação.
//  - Auto-renew: se o POST volta sem dados de ação (hash expirado) ou falha por
//    HTTP, o client re-abre a página (priming/último GET da rota) e repete uma
//    vez. A tentativa inválida é lançada e LOGADA como ERROR (observabilidade).

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

/** Resposta HTTP OK porém sem dados de ação — hash `Next-Action` expirado/errado. */
export class StaleSessionError extends GnJoyError {
  constructor(message = 'Sessão Next-Action expirada (resposta sem dados de ação).') {
    super(message, null)
    this.name = 'StaleSessionError'
  }
}

export class GnJoyClient {
  /** hash dinâmico `Next-Action` por rota (pathname). */
  private readonly nextActionByRoute = new Map<string, string>()
  /** último GET bem-sucedido por rota — usado para renovar a sessão da rota. */
  private readonly lastGetByRoute = new Map<string, GnJoyEndpoint>()
  /** rota do GET mais recente (base do getter `currentNextAction`). */
  private lastGetRoute: string | null = null

  constructor(
    private readonly queue: RequestQueueManager = RequestQueueManager.getInstance(),
    private readonly fetchImpl: FetchLike = fetch as unknown as FetchLike,
  ) {}

  /** Executa um GET (RSC) e captura o hash Next-Action da rota. */
  get(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    return this.enqueueGet(endpoint, priority)
  }

  /** Executa um POST (Server Action) com sessão por-rota e auto-renew. */
  async post(endpoint: GnJoyEndpoint, priority: RequestPriority = 'HIGH'): Promise<string> {
    // Garante que a "página" da ação foi aberta (hash da rota presente).
    if (!this.nextActionByRoute.has(endpoint.route) && endpoint.priming) {
      await this.enqueueGet(endpoint.priming, priority)
    }

    try {
      return await this.enqueuePost(endpoint, priority)
    } catch (error) {
      if (!(error instanceof GnJoyError)) throw error
      // Renova a sessão DA MESMA ROTA e repete o POST uma única vez.
      const renew = endpoint.priming ?? this.lastGetByRoute.get(endpoint.route)
      if (!renew) {
        throw new GnJoyError('Resposta inválida e sem GET prévio para renovar a sessão.')
      }
      await this.enqueueRenew(renew, priority)
      try {
        return await this.enqueuePost(endpoint, priority)
      } catch (retryError) {
        if (retryError instanceof StaleSessionError) {
          throw new GnJoyError('Falha ao renovar a sessão Next-Action.')
        }
        throw retryError
      }
    }
  }

  /** Hash Next-Action da rota do último GET (volátil). Exposto p/ diagnóstico/testes. */
  get currentNextAction(): string | null {
    return this.lastGetRoute ? (this.nextActionByRoute.get(this.lastGetRoute) ?? null) : null
  }

  private enqueueGet(endpoint: GnJoyEndpoint, priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(() => this.rawGet(endpoint), {
      method: 'GET',
      path: endpoint.path,
      humanAction: endpoint.humanAction,
      priority,
    })
  }

  private enqueueRenew(endpoint: GnJoyEndpoint, priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(() => this.rawGet(endpoint), {
      method: 'GET',
      path: `renew:${endpoint.route}`,
      humanAction: 'Renovando sessão...',
      priority,
    })
  }

  private enqueuePost(endpoint: GnJoyEndpoint, priority: RequestPriority): Promise<string> {
    return this.queue.enqueue(
      async () => {
        const text = await this.rawPost(endpoint)
        // Falha LÓGICA (sem dados de ação) lançada AQUI para que a fila a logue
        // como ERROR — caso contrário o app mostraria "200" num POST que falhou.
        if (parseActionData(text) === null) throw new StaleSessionError()
        return text
      },
      { method: 'POST', path: endpoint.path, humanAction: endpoint.humanAction, priority },
    )
  }

  private async rawGet(endpoint: GnJoyEndpoint): Promise<string> {
    const res = await this.fetchImpl(endpoint.url, { method: 'GET', headers: { RSC: '1' } })
    if (!res.ok) throw new GnJoyError(`GET falhou (${res.status})`, res.status)
    const text = await res.text()
    const hash = extractNextAction(text)
    if (hash) this.nextActionByRoute.set(endpoint.route, hash)
    this.lastGetByRoute.set(endpoint.route, endpoint)
    this.lastGetRoute = endpoint.route
    return text
  }

  private async rawPost(endpoint: GnJoyEndpoint): Promise<string> {
    const res = await this.fetchImpl(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/x-component',
        'Next-Action': this.nextActionByRoute.get(endpoint.route) ?? '',
      },
      body: JSON.stringify(endpoint.payload),
    })
    if (!res.ok) throw new GnJoyError(`POST falhou (${res.status})`, res.status)
    return res.text()
  }
}
