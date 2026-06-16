// tests/shared/log.spec.ts
import { describe, expect, it } from 'vitest'
import { appendBounded, LOG_HISTORY_LIMIT, resolveLogColor } from '@shared/log'

describe('resolveLogColor', () => {
  it('mapeia cada status para sua cor semântica', () => {
    expect(resolveLogColor('SUCCESS')).toBe('success')
    expect(resolveLogColor('ERROR')).toBe('error')
    expect(resolveLogColor('IN_PROGRESS')).toBe('progress')
    expect(resolveLogColor('PENDING')).toBe('pending')
  })
})

describe('appendBounded (slice(-50) anti memory leak)', () => {
  it('mantém apenas os últimos LOG_HISTORY_LIMIT registros', () => {
    let history: number[] = []
    for (let i = 0; i < 120; i++) {
      history = appendBounded(history, i)
    }
    expect(history).toHaveLength(LOG_HISTORY_LIMIT)
    expect(history[0]).toBe(120 - LOG_HISTORY_LIMIT)
    expect(history.at(-1)).toBe(119)
  })

  it('não muta o array original', () => {
    const original = [1, 2, 3]
    const next = appendBounded(original, 4)
    expect(original).toEqual([1, 2, 3])
    expect(next).toEqual([1, 2, 3, 4])
  })
})
