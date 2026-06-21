// tests/main/hybridNotifier.spec.ts
import { describe, expect, it, vi } from 'vitest'
import { makeHybridNotifier } from '@main/services/store/hybridNotifier'

const ALERT = { title: 'Venda detectada! 💰', body: 'Você vendeu 3 unidade(s).' }

describe('makeHybridNotifier (F4 — notificação híbrida)', () => {
  it('janela em foco => toast in-app, sem notificação nativa', () => {
    const toast = vi.fn()
    const osNotify = vi.fn()
    const notify = makeHybridNotifier({ isAppFocused: () => true, toast, osNotify })

    notify(ALERT)

    expect(toast).toHaveBeenCalledWith(ALERT)
    expect(osNotify).not.toHaveBeenCalled()
  })

  it('janela minimizada/fora de foco => notificação nativa, sem toast', () => {
    const toast = vi.fn()
    const osNotify = vi.fn()
    const notify = makeHybridNotifier({ isAppFocused: () => false, toast, osNotify })

    notify(ALERT)

    expect(osNotify).toHaveBeenCalledWith(ALERT)
    expect(toast).not.toHaveBeenCalled()
  })
})
