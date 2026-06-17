// src/main/services/gnjoy/RequestQueueManager.ts
// Fila global de requisições à GnJoy — Singleton ABSOLUTO hospedado no Main Process.
//
// Garantias críticas (violá-las = IP Ban):
//  - No máximo 1 requisição a cada 3000ms (espaçamento entre INÍCIOS de tarefa).
//  - Singleton: duas instâncias simultâneas derrubariam o controle de rate limit.
//  - Resiliência: timeout/erro de uma tarefa JAMAIS congela a fila — libera,
//    reporta ao logger e segue para a próxima graciosamente.
//  - Prioridade: HIGH (Minha Loja / comandos do usuário) > NORMAL (ciclo da
//    Watchlist) > LOW (importação em massa). FIFO dentro da mesma prioridade.

import { EventEmitter } from 'node:events'
import type {
  QueueStatus,
  RequestLogEntry,
  RequestMethod,
  RequestPriority,
} from '@shared/types/domain'

/** Cooldown padrão entre requisições (rate limit rígido da GnJoy). */
export const DEFAULT_COOLDOWN_MS = 3000
/** Timeout padrão por requisição (a GnJoy "trava" com frequência). */
export const DEFAULT_TIMEOUT_MS = 15000

const PRIORITY_RANK: Record<RequestPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }

export interface EnqueueMeta {
  method: RequestMethod
  /** Path técnico completo (Developer View do Request Log). */
  path: string
  /** Tradução amigável da tarefa (visão colapsada). */
  humanAction: string
  priority?: RequestPriority
  timeoutMs?: number
}

interface Job<T> {
  readonly id: string
  readonly seq: number
  readonly rank: number
  readonly meta: Required<Pick<EnqueueMeta, 'priority' | 'timeoutMs'>> & EnqueueMeta
  readonly task: () => Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (reason: unknown) => void
}

export interface RequestQueueEvents {
  log: (entry: RequestLogEntry) => void
  queue: (status: QueueStatus) => void
}

export class RequestQueueManager extends EventEmitter {
  private static instance: RequestQueueManager | null = null

  private readonly queue: Job<unknown>[] = []
  private running = false
  private nextAllowedStart = 0
  private seqCounter = 0
  private idCounter = 0

  private constructor(
    private readonly cooldownMs: number = DEFAULT_COOLDOWN_MS,
    private readonly defaultTimeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {
    super()
  }

  /** Acesso ao Singleton. Os parâmetros só valem na primeira criação. */
  static getInstance(cooldownMs?: number, defaultTimeoutMs?: number): RequestQueueManager {
    if (!RequestQueueManager.instance) {
      RequestQueueManager.instance = new RequestQueueManager(cooldownMs, defaultTimeoutMs)
    }
    return RequestQueueManager.instance
  }

  /** APENAS para testes: descarta o Singleton para isolar cenários. */
  static __resetForTests(): void {
    RequestQueueManager.instance = null
  }

  get pending(): number {
    return this.queue.length
  }

  get isProcessing(): boolean {
    return this.running
  }

  /**
   * Enfileira uma tarefa de rede. Resolve/rejeita com o resultado da `task`,
   * sempre respeitando o cooldown global e a prioridade.
   */
  enqueue<T>(task: () => Promise<T>, meta: EnqueueMeta): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const priority = meta.priority ?? 'NORMAL'
      const job: Job<T> = {
        id: this.nextId(),
        seq: this.seqCounter++,
        rank: PRIORITY_RANK[priority],
        meta: { ...meta, priority, timeoutMs: meta.timeoutMs ?? this.defaultTimeoutMs },
        task,
        resolve,
        reject,
      }
      this.queue.push(job as Job<unknown>)
      this.emitLog(job, 'PENDING', null)
      this.emitQueue(null)
      this.pump()
    })
  }

  private pump(): void {
    if (!this.running) {
      this.running = true
      void this.runLoop()
    }
  }

  private async runLoop(): Promise<void> {
    while (this.queue.length > 0) {
      const job = this.takeNext()
      const wait = Math.max(0, this.nextAllowedStart - Date.now())
      if (wait > 0) await delay(wait)

      const startedAt = Date.now()
      this.nextAllowedStart = startedAt + this.cooldownMs
      this.emitLog(job, 'IN_PROGRESS', null)
      this.emitQueue(job.meta.humanAction)

      try {
        const result = await withTimeout(job.task(), job.meta.timeoutMs)
        job.resolve(result)
        this.emitLog(job, 'SUCCESS', 200)
      } catch (error) {
        // Resiliência: a fila não congela — reporta o erro e segue.
        job.reject(error)
        this.emitLog(job, 'ERROR', httpStatusOf(error))
      }
    }
    this.running = false
    this.emitQueue(null)
  }

  /** Remove e retorna o job de maior prioridade (rank menor; FIFO no empate). */
  private takeNext(): Job<unknown> {
    let bestIndex = 0
    for (let i = 1; i < this.queue.length; i++) {
      const a = this.queue[i]
      const b = this.queue[bestIndex]
      if (a.rank < b.rank || (a.rank === b.rank && a.seq < b.seq)) {
        bestIndex = i
      }
    }
    return this.queue.splice(bestIndex, 1)[0]
  }

  private emitLog<T>(
    job: Job<T>,
    status: RequestLogEntry['status'],
    httpStatus: number | null,
  ): void {
    const entry: RequestLogEntry = {
      id: job.id,
      method: job.meta.method,
      path: job.meta.path,
      status,
      httpStatus,
      humanAction: job.meta.humanAction,
      priority: job.meta.priority ?? 'NORMAL',
      timestamp: Date.now(),
    }
    this.emit('log', entry)
  }

  private emitQueue(currentAction: string | null): void {
    const status: QueueStatus = {
      pending: this.queue.length,
      isProcessing: this.running,
      currentAction,
    }
    this.emit('queue', status)
  }

  private nextId(): string {
    return `req_${Date.now().toString(36)}_${(this.idCounter++).toString(36)}`
  }
}

/** Promessa de atraso baseada em setTimeout (compatível com fake timers). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Aplica timeout a uma promessa sem deixar timers pendentes. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RequestTimeoutError(ms)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export class RequestTimeoutError extends Error {
  constructor(ms: number) {
    super(`Requisição excedeu o timeout de ${ms}ms`)
    this.name = 'RequestTimeoutError'
  }
}

function httpStatusOf(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    if (typeof status === 'number') return status
  }
  return null
}
