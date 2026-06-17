// tests/renderer/searchBar.spec.tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SearchBar } from '@renderer/components/Search/SearchBar'
import { NavigationProvider } from '@renderer/contexts/NavigationContext'
import { ToastProvider } from '@renderer/contexts/ToastContext'
import type { OlhoDeOdinApi } from '@shared/types/ipc'

function renderSearchBar() {
  return render(
    <ToastProvider>
      <NavigationProvider>
        <SearchBar />
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

describe('SearchBar (T019/T025)', () => {
  it('debounce de 300ms: múltiplos Enter (spamming) disparam UMA busca', async () => {
    const invoke = vi.fn().mockResolvedValue([])
    window.api = {
      invoke,
      on: () => () => {},
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    renderSearchBar()
    const input = screen.getByLabelText('Buscar item')
    fireEvent.change(input, { target: { value: 'elixir' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.keyDown(input, { key: 'Enter' })

    await vi.advanceTimersByTimeAsync(300)

    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith(
      'search:items',
      expect.objectContaining({ searchWord: 'elixir' }),
    )
  })

  it('não busca com termo vazio', async () => {
    const invoke = vi.fn().mockResolvedValue([])
    window.api = {
      invoke,
      on: () => () => {},
      system: { ping: vi.fn(), getAppInfo: vi.fn() },
    } as unknown as OlhoDeOdinApi

    renderSearchBar()
    fireEvent.keyDown(screen.getByLabelText('Buscar item'), { key: 'Enter' })
    await vi.advanceTimersByTimeAsync(300)

    expect(invoke).not.toHaveBeenCalled()
  })
})
