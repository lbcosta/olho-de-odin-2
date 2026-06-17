// tests/main/bulkImport.spec.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestQueueManager } from '@main/services/gnjoy/RequestQueueManager'
import { BulkImportService, parseBulkText } from '@main/services/search/BulkImport'

describe('parseBulkText (higienização)', () => {
  it('faz trim, normaliza espaços e descarta linhas vazias', () => {
    const content = '  Elixir Vermelho  \n\n\t Maçã   Real \n   \n'
    expect(parseBulkText(content)).toEqual(['Elixir Vermelho', 'Maçã Real'])
  })

  it('remove duplicatas case-insensitive preservando a ordem', () => {
    const content = 'Jellopy\njellopy\nJELLOPY\nFabric'
    expect(parseBulkText(content)).toEqual(['Jellopy', 'Fabric'])
  })

  it('limita o tamanho de cada nome', () => {
    const long = 'a'.repeat(250)
    expect(parseBulkText(long, 100)).toEqual(['a'.repeat(100)])
  })

  it('aceita finais de linha Windows (\\r\\n)', () => {
    expect(parseBulkText('A\r\nB\r\n')).toEqual(['A', 'B'])
  })
})

describe('BulkImportService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    RequestQueueManager.__resetForTests()
  })
  afterEach(() => {
    vi.useRealTimers()
    RequestQueueManager.__resetForTests()
  })

  it('enfileira uma tarefa de BAIXA prioridade por item e processa cada nome', async () => {
    const queue = RequestQueueManager.getInstance(3000)
    const processed: string[] = []
    const processor = vi.fn(async (name: string) => {
      processed.push(name)
    })
    const service = new BulkImportService(queue, processor)

    const result = service.importFromText('Elixir\nJellopy\nFabric')
    expect(result.queued).toBe(3)
    // A 1ª tarefa já entra em processamento (slot livre); restam 2 pendentes.
    expect(queue.pending).toBe(2)

    await vi.advanceTimersByTimeAsync(6000) // 3 itens => 0s, 3s, 6s

    expect(processed).toEqual(['Elixir', 'Jellopy', 'Fabric'])
    expect(processor).toHaveBeenCalledTimes(3)
  })

  it('não enfileira nada para conteúdo vazio', () => {
    const queue = RequestQueueManager.getInstance(3000)
    const service = new BulkImportService(
      queue,
      vi.fn(async () => {}),
    )
    expect(service.importFromText('  \n\n').queued).toBe(0)
    expect(queue.pending).toBe(0)
  })
})
