// tests/main/watchlistMonitor.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WatchlistMonitor } from '@main/services/watchlist/WatchlistMonitor'
import type { ProfileService } from '@main/services/profile/ProfileService'
import type { StoreTracker } from '@main/services/store/StoreTracker'
import type { ItemDetails } from '@shared/types/ipc'
import type { RequestPriority, ServerType, WatchlistEntry } from '@shared/types/domain'

function entry(itemId: number, opts: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return { profileId: 1, itemId, isMonitoring: true, isInMyStore: false, createdAt: '', ...opts }
}

function details(itemId: number): ItemDetails {
  return {
    item: { itemId, name: `Item ${itemId}`, type: '', imgPath: '', updatedAt: '' },
    listings: [],
    analysis: null,
    updatedAt: '',
  }
}

function profilesStub(entries: WatchlistEntry[]): ProfileService {
  return {
    getActive: () => ({ id: 1, name: 'P', characterName: 'Odin', createdAt: '', updatedAt: '' }),
    listWatchlist: () => entries,
  } as unknown as ProfileService
}

function trackerStub(): StoreTracker {
  return { track: vi.fn() } as unknown as StoreTracker
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('WatchlistMonitor (Bug #2b — ciclo unificado no Main Process)', () => {
  it('pula itens pausados e não re-sincroniza em rajada (Bug #2a)', async () => {
    const monitored = entry(1)
    const paused = entry(2, { isMonitoring: false })
    const syncCalls: number[] = []
    const syncItem = vi.fn(async (itemId: number) => {
      syncCalls.push(itemId)
      return details(itemId)
    })
    const monitor = new WatchlistMonitor(
      profilesStub([monitored, paused]),
      syncItem,
      trackerStub(),
      vi.fn(),
    )

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(5000) // janela curta (« 60s do ciclo p/ 1 item)

    expect(syncCalls).not.toContain(2)
    expect(syncCalls).toContain(1)
    expect(syncCalls.length).toBeLessThanOrEqual(1)

    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)
  })

  it('alimenta o StoreTracker com os listings já buscados — sem fetch extra', async () => {
    const myStore = entry(1, { isInMyStore: true })
    const syncItem = vi.fn(async (itemId: number) => details(itemId))
    const storeTracker = trackerStub()
    const monitor = new WatchlistMonitor(profilesStub([myStore]), syncItem, storeTracker, vi.fn())

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(1000)
    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)

    expect(syncItem).toHaveBeenCalledTimes(1)
    expect(storeTracker.track).toHaveBeenCalledTimes(1)
    expect(storeTracker.track).toHaveBeenCalledWith(1, details(1).listings)
  })

  it('não alimenta o StoreTracker para itens fora de isInMyStore', async () => {
    const regular = entry(3)
    const syncItem = vi.fn(async (itemId: number) => details(itemId))
    const storeTracker = trackerStub()
    const monitor = new WatchlistMonitor(profilesStub([regular]), syncItem, storeTracker, vi.fn())

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(1000)
    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)

    expect(storeTracker.track).not.toHaveBeenCalled()
  })

  it('transmite os estados queued -> updating -> idle por card', async () => {
    const item = entry(7)
    const syncItem = vi.fn(async (itemId: number) => details(itemId))
    const broadcast = vi.fn()
    const monitor = new WatchlistMonitor(profilesStub([item]), syncItem, trackerStub(), broadcast)

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(1000)
    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)

    const states = broadcast.mock.calls.map(([, state]) => state)
    expect(states.slice(0, 3)).toEqual(['queued', 'updating', 'idle'])
  })

  it('sem perfil ativo ou Watchlist vazia, não chama a rede', async () => {
    const syncItem = vi.fn()
    const monitor = new WatchlistMonitor(profilesStub([]), syncItem, trackerStub(), vi.fn())

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(5000)
    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)

    expect(syncItem).not.toHaveBeenCalled()
  })

  it('setEnabled(false) interrompe o loop sem novas chamadas de rede', async () => {
    const item = entry(9)
    const syncItem = vi.fn(async (itemId: number) => details(itemId))
    const monitor = new WatchlistMonitor(profilesStub([item]), syncItem, trackerStub(), vi.fn())

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(1000)
    expect(syncItem).toHaveBeenCalledTimes(1)

    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(120_000) // bem além do ciclo de 60s

    expect(syncItem).toHaveBeenCalledTimes(1)
  })

  it('prioriza itens isInMyStore como HIGH e itens comuns como NORMAL (F3)', async () => {
    const regular = entry(1)
    const mine = entry(2, { isInMyStore: true })
    const calls: Array<{ itemId: number; serverType: ServerType; priority: RequestPriority }> = []
    const syncItem = vi.fn(
      async (itemId: number, serverType: ServerType, priority: RequestPriority) => {
        calls.push({ itemId, serverType, priority })
        return details(itemId)
      },
    )
    const monitor = new WatchlistMonitor(
      profilesStub([regular, mine]),
      syncItem,
      trackerStub(),
      vi.fn(),
    )

    monitor.setEnabled(true)
    await vi.advanceTimersByTimeAsync(35_000) // 2 itens => espaçamento 30s (item1 ~0s, item2 ~30s)
    monitor.setEnabled(false)
    await vi.advanceTimersByTimeAsync(600)

    expect(calls.find((c) => c.itemId === 1)?.priority).toBe('NORMAL')
    expect(calls.find((c) => c.itemId === 2)?.priority).toBe('HIGH')
  })
})
