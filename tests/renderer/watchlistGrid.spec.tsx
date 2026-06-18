// tests/renderer/watchlistGrid.spec.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WatchlistGrid } from '@renderer/components/Watchlist/WatchlistGrid'
import { NavigationProvider } from '@renderer/contexts/NavigationContext'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import type { ItemDetails } from '@shared/types/ipc'
import type { OlhoDeOdinApi } from '@shared/types/ipc'

const monitored = { profileId: 1, itemId: 1, isMonitoring: true, isInMyStore: false, createdAt: '' }
const paused = { profileId: 1, itemId: 2, isMonitoring: false, isInMyStore: false, createdAt: '' }

function details(itemId: number): ItemDetails {
  return {
    item: { itemId, name: `Item ${itemId}`, type: '', imgPath: '', updatedAt: '' },
    listings: [],
    analysis: null,
    updatedAt: '',
  }
}

function renderGrid() {
  return render(
    <ToastProvider>
      <NavigationProvider>
        <WatchlistGrid />
      </NavigationProvider>
    </ToastProvider>,
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

describe('WatchlistGrid — monitoramento (Bug #2a)', () => {
  it('pula itens pausados e não re-sincroniza em rajada', async () => {
    const syncCalls: number[] = []
    const invoke = vi.fn(async (channel: string, payload?: { itemId: number }) => {
      if (channel === 'watchlist:list') return [monitored, paused]
      if (channel === 'item:get-details') return details(payload!.itemId)
      if (channel === 'item:sync') {
        syncCalls.push(payload!.itemId)
        return details(payload!.itemId)
      }
      return undefined
    })
    window.api = {
      invoke,
      on: () => () => {},
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    renderGrid()
    await vi.advanceTimersByTimeAsync(50) // carrega a watchlist
    fireEvent.click(screen.getByRole('switch')) // liga o monitoramento
    await vi.advanceTimersByTimeAsync(5000) // janela curta (« 60s do ciclo p/ 1 item)

    // Item pausado nunca é sincronizado; o monitorado não dispara em rajada.
    expect(syncCalls).not.toContain(2)
    expect(syncCalls).toContain(1)
    expect(syncCalls.length).toBeLessThanOrEqual(1)

    fireEvent.click(screen.getByRole('switch')) // desliga (encerra o loop)
    await vi.advanceTimersByTimeAsync(600)
  })
})
