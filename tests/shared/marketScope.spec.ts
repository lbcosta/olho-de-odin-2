// tests/shared/marketScope.spec.ts
import { describe, expect, it } from 'vitest'
import { MARKET_STORE_TYPE } from '@shared/marketScope'

describe('MARKET_STORE_TYPE (Bug #1)', () => {
  it('é BUY — lojas VENDENDO itens (escopo da aplicação), nunca SELL', () => {
    expect(MARKET_STORE_TYPE).toBe('BUY')
  })
})
