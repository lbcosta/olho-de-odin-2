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

describe('BulkImportService (sem reentrância na fila — F2)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    RequestQueueManager.__resetForTests()
  })
  afterEach(() => {
    vi.useRealTimers()
    RequestQueueManager.__resetForTests()
  })

  it('despacha cada item por UMA busca LOW sem travar a fila (regressão do deadlock)', async () => {
    // O processador SIMULA o fluxo real (searchItems): ele mesmo enfileira a
    // busca na fila global. Com o bug antigo — BulkImportService re-enfileirava
    // o processador — o job externo prenderia o slot único aguardando este job
    // interno, travando a fila (searched ficaria vazio até o timeout).
    const queue = RequestQueueManager.getInstance(3000)
    const searched: string[] = []
    const processor = (name: string) =>
      queue.enqueue(
        async () => {
          searched.push(name)
        },
        {
          method: 'GET' as const,
          path: '/trading',
          humanAction: `Buscando "${name}"`,
          priority: 'LOW' as const,
        },
      )
    const service = new BulkImportService(processor)

    const result = service.importFromText('Elixir\nJellopy\nFabric')
    expect(result.queued).toBe(3)

    await vi.advanceTimersByTimeAsync(6000) // 3 buscas LOW => 0s, 3s, 6s

    expect(searched).toEqual(['Elixir', 'Jellopy', 'Fabric'])
  })

  it('não despacha nada para conteúdo vazio', () => {
    const processor = vi.fn(async () => {})
    const service = new BulkImportService(processor)
    expect(service.importFromText('  \n\n').queued).toBe(0)
    expect(processor).not.toHaveBeenCalled()
  })
})
