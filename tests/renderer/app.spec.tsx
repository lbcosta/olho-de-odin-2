// tests/renderer/app.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import App from '@renderer/App'
import type { AppInfo } from '@shared/types/ipc'

afterEach(() => {
  cleanup()
  // @ts-expect-error limpeza do stub global entre testes
  delete window.api
})

describe('<App />', () => {
  it('renderiza o cabeçalho mesmo sem a ponte IPC (degradação graciosa)', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Olho de Odin/i })).toBeInTheDocument()
  })

  it('exibe as informações do app vindas da ponte IPC', async () => {
    const appInfo: AppInfo = {
      name: 'Olho de Odin 2',
      version: '0.1.0',
      electron: '31.0.0',
      chrome: '126.0.0',
      node: '20.0.0',
      platform: 'win32',
    }
    window.api = {
      invoke: vi.fn(),
      on: vi.fn(() => () => {}),
      system: {
        ping: vi.fn().mockResolvedValue('pong'),
        getAppInfo: vi.fn().mockResolvedValue(appInfo),
      },
    }

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Olho de Odin 2 v0\.1\.0/)).toBeInTheDocument()
    })
  })
})
