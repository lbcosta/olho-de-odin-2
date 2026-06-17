// tests/renderer/profileManager.spec.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ProfileManager } from '@renderer/components/Profile/ProfileManager'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import type { OlhoDeOdinApi } from '@shared/types/ipc'

const PROFILE = { id: 1, name: 'Mercador', characterName: 'Odin', createdAt: '', updatedAt: '' }

function renderManager() {
  return render(
    <ToastProvider>
      <ProfileManager />
    </ToastProvider>,
  )
}

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'api')
})

describe('ProfileManager (T029)', () => {
  it('lista perfis e destaca o ativo', async () => {
    const invoke = vi.fn(async (channel: string) => {
      if (channel === 'profile:list') return [PROFILE]
      if (channel === 'profile:get-active') return PROFILE
      return undefined
    })
    window.api = {
      invoke,
      on: () => () => {},
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    renderManager()

    await waitFor(() => expect(screen.getByText('Mercador')).toBeInTheDocument())
    expect(screen.getByText('ativo')).toBeInTheDocument()
  })

  it('cria um novo perfil via IPC', async () => {
    const invoke = vi.fn(async (channel: string) => {
      if (channel === 'profile:list') return [PROFILE]
      if (channel === 'profile:get-active') return PROFILE
      if (channel === 'profile:create') return { ...PROFILE, id: 2, name: 'Novo' }
      return undefined
    })
    window.api = {
      invoke,
      on: () => () => {},
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    renderManager()
    await waitFor(() => expect(screen.getByText('Mercador')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Nome do perfil'), { target: { value: 'Novo' } })
    fireEvent.click(screen.getByText('Criar'))

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'profile:create',
        expect.objectContaining({ name: 'Novo' }),
      ),
    )
  })
})
