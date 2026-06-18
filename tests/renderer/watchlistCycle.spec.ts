// tests/renderer/watchlistCycle.spec.ts
import { describe, expect, it } from 'vitest'
import {
  MIN_ITEM_SPACING_MS,
  WATCHLIST_CYCLE_TARGET_MS,
  watchlistSpacingMs,
} from '@renderer/utils/watchlistCycle'

describe('watchlistSpacingMs (Bug #2a — cadência)', () => {
  it('1 item => espaça pelo ciclo-alvo inteiro (não re-busca em rajada)', () => {
    expect(watchlistSpacingMs(1)).toBe(WATCHLIST_CYCLE_TARGET_MS)
  })

  it('distribui o ciclo entre N itens (S = T/N)', () => {
    expect(watchlistSpacingMs(10)).toBe(WATCHLIST_CYCLE_TARGET_MS / 10)
  })

  it('nunca fica abaixo do Rate Limit de 3s', () => {
    expect(watchlistSpacingMs(1000)).toBe(MIN_ITEM_SPACING_MS)
    expect(watchlistSpacingMs(0)).toBe(MIN_ITEM_SPACING_MS)
  })
})
