// tests/renderer/marketDisplay.spec.ts
import { describe, expect, it } from 'vitest'
import { formatRelativeTime, formatZeny, formatZenyOrDash } from '@renderer/utils/marketDisplay'

const NOW = new Date('2026-06-18T12:00:00Z')
const S = 1000
const MIN = 60 * S
const HR = 60 * MIN
const DAY = 24 * HR
const ago = (ms: number): string => new Date(NOW.getTime() - ms).toISOString()

describe('formatRelativeTime (Problema 1)', () => {
  it('segundos recentes => "agora"', () => {
    expect(formatRelativeTime(ago(10 * S), NOW)).toBe('agora')
  })
  it('~1 min', () => {
    expect(formatRelativeTime(ago(50 * S), NOW)).toBe('há 1 min')
  })
  it('N min', () => {
    expect(formatRelativeTime(ago(5 * MIN), NOW)).toBe('há 5 min')
  })
  it('horas', () => {
    expect(formatRelativeTime(ago(3 * HR), NOW)).toBe('há 3 h')
  })
  it('1 dia', () => {
    expect(formatRelativeTime(ago(25 * HR), NOW)).toBe('há 1 dia')
  })
  it('dias', () => {
    expect(formatRelativeTime(ago(3 * DAY), NOW)).toBe('há 3 dias')
  })
  it('1 semana', () => {
    expect(formatRelativeTime(ago(8 * DAY), NOW)).toBe('há 1 semana')
  })
  it('data inválida => devolve a string original', () => {
    expect(formatRelativeTime('not-a-date', NOW)).toBe('not-a-date')
  })
})

describe('formatZenyOrDash (Bug 2 — sem histórico)', () => {
  it('valor > 0 => formata como zeny (igual a formatZeny)', () => {
    expect(formatZenyOrDash(1500)).toBe(formatZeny(1500))
  })
  it('0 (média ponderada sem histórico) => "—", nunca "0z"', () => {
    expect(formatZenyOrDash(0)).toBe('—')
  })
})
