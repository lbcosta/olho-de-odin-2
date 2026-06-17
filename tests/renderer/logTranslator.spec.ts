// tests/renderer/logTranslator.spec.ts
import { describe, expect, it } from 'vitest'
import { translateLogPath } from '@renderer/utils/LogTranslator'

describe('translateLogPath (T016)', () => {
  it('mascara paths técnicos em ações humanizadas', () => {
    expect(translateLogPath('/pt/intro/shop-search/trading?storeType=SELL')).toBe(
      'Verificando concorrência...',
    )
    expect(translateLogPath('/pt/intro/shop-search/trading [store 123]')).toBe(
      'Buscando localização da loja...',
    )
    expect(translateLogPath('/pt/intro/shop-search/trading [item 123]')).toBe(
      'Buscando detalhes do item...',
    )
    expect(translateLogPath('/pt/intro/shop-search/market-price [price 1]')).toBe(
      'Atualizando histórico de preços...',
    )
    expect(translateLogPath('/pt/intro/shop-search/market-price?period=ALL')).toBe(
      'Consultando histórico de mercado...',
    )
    expect(translateLogPath('renew:next-action')).toBe('Renovando sessão...')
  })

  it('usa fallback genérico para paths desconhecidos', () => {
    expect(translateLogPath('/algo/inesperado')).toBe('Comunicando com a GnJoy...')
  })
})
