// tests/renderer/logViewer.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LogViewer } from '@renderer/components/RequestLog/LogViewer'
import type { OlhoDeOdinApi } from '@shared/types/ipc'
import type { QueueStatus, RequestLogEntry } from '@shared/types/domain'

let logCb: ((entry: RequestLogEntry) => void) | null = null
let queueCb: ((status: QueueStatus) => void) | null = null

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: hidden ? 'hidden' : 'visible',
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

function setupApi(): void {
  const api = {
    invoke: vi.fn(),
    on: (event: string, cb: (payload: unknown) => void) => {
      if (event === 'event:log-entry') logCb = cb as (e: RequestLogEntry) => void
      if (event === 'event:queue-status') queueCb = cb as (s: QueueStatus) => void
      return () => {}
    },
    system: { ping: vi.fn(), getAppInfo: vi.fn() },
  }
  window.api = api as unknown as OlhoDeOdinApi
}

function entry(i: number, status: RequestLogEntry['status'] = 'SUCCESS'): RequestLogEntry {
  return {
    id: `r${i}`,
    method: 'GET',
    path: '/pt/intro/shop-search/trading',
    status,
    httpStatus: 200,
    humanAction: 'x',
    priority: 'NORMAL',
    timestamp: i,
  }
}

afterEach(() => {
  cleanup()
  logCb = null
  queueCb = null
  setHidden(false)
  Reflect.deleteProperty(window, 'api')
})

describe('LogViewer', () => {
  it('mantém no máximo 50 registros (slice(-50)) — anti memory leak (T024)', () => {
    setupApi()
    const { container } = render(<LogViewer />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    act(() => {
      for (let i = 0; i < 60; i++) logCb?.(entry(i))
    })

    expect(container.querySelectorAll('li')).toHaveLength(50)
  })

  it('aplica a cor semântica do status', () => {
    setupApi()
    const { container } = render(<LogViewer />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    act(() => {
      logCb?.(entry(1, 'ERROR'))
    })

    expect(container.querySelector('.oo-log-dot--error')).toBeTruthy()
  })

  it('mostra a ação amigável e colore o texto por status (Problema 2)', () => {
    setupApi()
    const { container } = render(<LogViewer />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    act(() => {
      logCb?.({ ...entry(1, 'SUCCESS'), humanAction: 'Buscando "elixir" no mercado...' })
    })

    // Aparece no cabeçalho colapsado E na linha expandida (consistência).
    expect(screen.getAllByText('Buscando "elixir" no mercado...').length).toBeGreaterThan(0)
    expect(container.querySelector('.text-log-success')).toBeTruthy()
  })

  it('linha de ERROR fica vermelha no texto, não verde', () => {
    setupApi()
    const { container } = render(<LogViewer />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))

    act(() => {
      logCb?.(entry(1, 'ERROR'))
    })

    expect(container.querySelector('.text-log-error')).toBeTruthy()
    expect(container.querySelector('.text-log-success')).toBeNull()
  })

  it('suspende a animação do spinner quando a janela está minimizada (F5)', () => {
    setupApi()
    const { container } = render(<LogViewer />)

    // Em foco + processando => spinner animado.
    act(() => {
      queueCb?.({ pending: 1, isProcessing: true, currentAction: 'x' })
    })
    expect(container.querySelector('.animate-spin')).toBeTruthy()

    // Minimizado => sem animação (preserva GPU), mesmo processando.
    act(() => {
      setHidden(true)
    })
    expect(container.querySelector('.animate-spin')).toBeNull()
  })
})
