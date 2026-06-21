// tests/renderer/watchlistGrid.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WatchlistGrid } from '@renderer/components/Watchlist/WatchlistGrid'
import { NavigationProvider } from '@renderer/contexts/NavigationContext'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import type { ItemDetails, OlhoDeOdinApi, WatchlistCardUpdate } from '@shared/types/ipc'

const monitored = { profileId: 1, itemId: 1, isMonitoring: true, isInMyStore: false, createdAt: '' }

function details(itemId: number): ItemDetails {
  return {
    item: { itemId, name: `Item ${itemId}`, type: '', imgPath: '', updatedAt: '' },
    listings: [],
    analysis: {
      metrics: {
        weightedAveragePrice: 1000,
        currentSpread: 50,
        competitionPressure: 0.5,
        lowestActivePrice: 900,
      },
      statuses: [],
      strategies: [],
      updatedAt: '',
    },
    updatedAt: '',
  }
}

let cardCb: ((payload: WatchlistCardUpdate) => void) | null = null

function setupApi(opts: { masterEnabled?: boolean } = {}): ReturnType<typeof vi.fn> {
  const invoke = vi.fn(async (channel: string, payload?: { itemId: number }) => {
    if (channel === 'watchlist:list') return [monitored]
    if (channel === 'item:get-details') return details(payload!.itemId)
    if (channel === 'watchlist:get-monitoring-master') {
      return { enabled: opts.masterEnabled ?? false }
    }
    if (channel === 'watchlist:set-monitoring-master') return undefined
    return undefined
  })
  window.api = {
    invoke,
    on: (event: string, cb: (payload: unknown) => void) => {
      if (event === 'event:watchlist-card') cardCb = cb as (p: WatchlistCardUpdate) => void
      return () => {}
    },
    system: { ping: vi.fn(), getAppInfo: vi.fn() },
  } as unknown as OlhoDeOdinApi
  return invoke
}

afterEach(() => {
  cleanup()
  cardCb = null
  Reflect.deleteProperty(window, 'api')
})

function renderGrid() {
  return render(
    <ToastProvider>
      <NavigationProvider>
        <WatchlistGrid />
      </NavigationProvider>
    </ToastProvider>,
  )
}

describe('WatchlistGrid — Master Switch delega o ciclo ao Main (Bug #2b)', () => {
  it('reflete o estado do Master Switch já ativo no Main ao montar', async () => {
    setupApi({ masterEnabled: true })
    renderGrid()

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('liga o Master Switch via IPC ao clicar (não roda mais o loop no Renderer)', async () => {
    const invoke = setupApi({ masterEnabled: false })
    renderGrid()
    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('switch'))
      await Promise.resolve()
    })

    expect(invoke).toHaveBeenCalledWith('watchlist:set-monitoring-master', { enabled: true })
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('reflete o progresso por-card emitido pelo Main: queued/updating/idle', async () => {
    setupApi()
    renderGrid()
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      cardCb?.({ itemId: 1, state: 'updating', details: null })
    })
    expect(screen.getByText('Atualizando…')).toBeTruthy()

    act(() => {
      cardCb?.({ itemId: 1, state: 'idle', details: details(1) })
    })
    expect(screen.queryByText('Atualizando…')).toBeNull()
    expect(screen.getByText('900z')).toBeTruthy()
  })
})
