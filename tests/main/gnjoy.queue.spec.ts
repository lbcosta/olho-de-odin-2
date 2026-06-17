// tests/main/gnjoy.queue.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RequestLogEntry } from '@shared/types/domain'
import { RequestQueueManager, RequestTimeoutError } from '@main/services/gnjoy/RequestQueueManager'

const META = { method: 'GET' as const, path: '/x', humanAction: 'Teste' }

beforeEach(() => {
  vi.useFakeTimers()
  RequestQueueManager.__resetForTests()
})

afterEach(() => {
  vi.useRealTimers()
  RequestQueueManager.__resetForTests()
})

describe('Singleton', () => {
  it('getInstance sempre retorna a mesma instância', () => {
    expect(RequestQueueManager.getInstance()).toBe(RequestQueueManager.getInstance())
  })
})

describe('Rate limit (3000ms entre inícios)', () => {
  it('5 chamadas simultâneas resolvem em 0s, 3s, 6s, 9s, 12s', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const t0 = Date.now()
    const startOffsets: number[] = []

    const promises = [0, 1, 2, 3, 4].map((i) =>
      queue.enqueue(async () => {
        startOffsets.push(Date.now() - t0)
        return i
      }, META),
    )

    await vi.advanceTimersByTimeAsync(12000)
    await Promise.all(promises)

    expect(startOffsets).toEqual([0, 3000, 6000, 9000, 12000])
  })
})

describe('Resiliência (timeout não congela a fila)', () => {
  it('libera a fila após timeout e processa a próxima tarefa', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    let secondRan = false

    const hanging = queue
      .enqueue(() => new Promise<string>(() => {}), { ...META, timeoutMs: 5000 })
      .catch((e) => e)
    const next = queue.enqueue(async () => {
      secondRan = true
      return 'ok'
    }, META)

    await vi.advanceTimersByTimeAsync(10000)

    expect(await hanging).toBeInstanceOf(RequestTimeoutError)
    await expect(next).resolves.toBe('ok')
    expect(secondRan).toBe(true)
  })

  it('um erro em uma tarefa não impede as demais', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const failed = queue
      .enqueue(async () => {
        throw new Error('boom')
      }, META)
      .catch((e) => (e as Error).message)
    const ok = queue.enqueue(async () => 'ok', META)

    await vi.advanceTimersByTimeAsync(6000)

    expect(await failed).toBe('boom')
    await expect(ok).resolves.toBe('ok')
  })
})

describe('Prioridade de fila', () => {
  it('HIGH passa na frente de NORMAL e LOW (entre tarefas pendentes)', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const order: string[] = []
    const push = (label: string) => async () => {
      order.push(label)
    }

    // A 1ª tarefa começa imediatamente (fila estava vazia). As demais,
    // pendentes, são reordenadas por prioridade.
    queue.enqueue(push('first'), { ...META, priority: 'NORMAL' })
    queue.enqueue(push('low'), { ...META, priority: 'LOW' })
    queue.enqueue(push('high'), { ...META, priority: 'HIGH' })
    queue.enqueue(push('normal2'), { ...META, priority: 'NORMAL' })

    await vi.advanceTimersByTimeAsync(12000)

    expect(order).toEqual(['first', 'high', 'normal2', 'low'])
  })
})

describe('Eventos de log', () => {
  it('emite PENDING -> IN_PROGRESS -> SUCCESS', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const statuses: RequestLogEntry['status'][] = []
    queue.on('log', (entry) => statuses.push(entry.status))

    const p = queue.enqueue(async () => 'ok', META)
    await vi.advanceTimersByTimeAsync(0)
    await p

    expect(statuses).toEqual(['PENDING', 'IN_PROGRESS', 'SUCCESS'])
  })

  it('emite ERROR com httpStatus quando o erro carrega status', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const entries: RequestLogEntry[] = []
    queue.on('log', (e) => entries.push(e))

    const p = queue
      .enqueue(async () => {
        throw Object.assign(new Error('rate limited'), { status: 429 })
      }, META)
      .catch(() => undefined)
    await vi.advanceTimersByTimeAsync(0)
    await p

    const errorEntry = entries.find((e) => e.status === 'ERROR')
    expect(errorEntry?.httpStatus).toBe(429)
  })
})
