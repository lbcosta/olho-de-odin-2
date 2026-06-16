// tests/shared/ipc.spec.ts
import { describe, expect, it } from 'vitest'
import { IpcChannel, IpcEvent } from '@shared/types/ipc'

describe('contrato IPC', () => {
  it('não possui nomes de canal duplicados', () => {
    const channels = Object.values(IpcChannel)
    expect(new Set(channels).size).toBe(channels.length)
  })

  it('canais e eventos não colidem entre si', () => {
    const all = [...Object.values(IpcChannel), ...Object.values(IpcEvent)]
    expect(new Set(all).size).toBe(all.length)
  })

  it('usa namespaces com prefixo (ex: "system:", "event:")', () => {
    for (const channel of Object.values(IpcChannel)) {
      expect(channel).toMatch(/^[a-z]+:[a-z-]+$/)
    }
    for (const event of Object.values(IpcEvent)) {
      expect(event).toMatch(/^event:[a-z-]+$/)
    }
  })
})
