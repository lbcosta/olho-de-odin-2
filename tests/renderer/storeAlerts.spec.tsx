// tests/renderer/storeAlerts.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import { ToastContainer } from '@renderer/components/ui/Toast'
import { useStoreAlerts } from '@renderer/hooks/useStoreAlerts'
import type { OlhoDeOdinApi, StoreAlert } from '@shared/types/ipc'

let alertCb: ((a: StoreAlert) => void) | null = null

function Harness(): React.JSX.Element {
  useStoreAlerts()
  return <ToastContainer />
}

afterEach(() => {
  cleanup()
  alertCb = null
  Reflect.deleteProperty(window, 'api')
})

describe('useStoreAlerts (F4 — toast in-app quando em foco)', () => {
  it('exibe um toast ao receber event:store-alert', () => {
    window.api = {
      invoke: vi.fn(),
      on: (event: string, cb: (payload: unknown) => void) => {
        if (event === 'event:store-alert') alertCb = cb as (a: StoreAlert) => void
        return () => {}
      },
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    )

    act(() => {
      alertCb?.({ title: 'Venda detectada! 💰', body: 'Você vendeu 3 unidade(s).' })
    })

    expect(screen.getByText(/Venda detectada/)).toBeTruthy()
  })
})
