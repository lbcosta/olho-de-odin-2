// tests/renderer/marketDisplay.spec.ts
import { describe, expect, it } from 'vitest'
import { formatRelativeTime, formatTimestamp, formatZeny } from '@renderer/utils/marketDisplay'

const NOW = new Date('2026-06-18T12:00:00Z')

/** Constrói um ISO a `seconds` no passado de NOW. */
function ago(seconds: number): string {
  return new Date(NOW.getTime() - seconds * 1000).toISOString()
}

const MIN = 60
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('formatRelativeTime (Problema 1 — "há X")', () => {
  it('mostra "agora mesmo" abaixo de 1 minuto', () => {
    expect(formatRelativeTime(ago(0), NOW)).toBe('agora mesmo')
    expect(formatRelativeTime(ago(59), NOW)).toBe('agora mesmo')
  })

  it('conta minutos, horas e dias com singular/plural', () => {
    expect(formatRelativeTime(ago(MIN), NOW)).toBe('há 1 min')
    expect(formatRelativeTime(ago(3 * MIN), NOW)).toBe('há 3 min')
    expect(formatRelativeTime(ago(HOUR), NOW)).toBe('há 1 hora')
    expect(formatRelativeTime(ago(5 * HOUR), NOW)).toBe('há 5 horas')
    expect(formatRelativeTime(ago(DAY), NOW)).toBe('há 1 dia')
    expect(formatRelativeTime(ago(3 * DAY), NOW)).toBe('há 3 dias')
  })

  it('agrega em semanas, meses e anos', () => {
    expect(formatRelativeTime(ago(7 * DAY), NOW)).toBe('há 1 semana')
    expect(formatRelativeTime(ago(14 * DAY), NOW)).toBe('há 2 semanas')
    expect(formatRelativeTime(ago(40 * DAY), NOW)).toBe('há 1 mês')
    expect(formatRelativeTime(ago(60 * DAY), NOW)).toBe('há 2 meses')
    expect(formatRelativeTime(ago(400 * DAY), NOW)).toBe('há 1 ano')
  })

  it('aceita o formato do SQLite (sem "T", UTC implícito)', () => {
    expect(formatRelativeTime('2026-06-18 11:55:00', NOW)).toBe('há 5 min')
  })

  it('retorna o valor cru para datas inválidas/vazias', () => {
    expect(formatRelativeTime('', NOW)).toBe('')
    expect(formatRelativeTime('não-é-data', NOW)).toBe('não-é-data')
  })
})

describe('formatTimestamp e formatZeny (regressão)', () => {
  it('formata zeny com separador de milhar e sufixo', () => {
    expect(formatZeny(1400)).toBe('1.400z')
    expect(formatZeny(0)).toBe('0z')
  })

  it('mantém o valor cru quando a data é inválida', () => {
    expect(formatTimestamp('')).toBe('')
  })
})
