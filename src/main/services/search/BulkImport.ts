// src/main/services/search/BulkImport.ts
// Importação em Massa via .txt (1 nome de item por linha).
// Higieniza as linhas e dispara, para cada nome, o processador injetado — que
// internamente enfileira sua própria busca (Prioridade BAIXA) na fila global.

/** Tamanho máximo aceito para um nome de item (higienização). */
export const MAX_ITEM_NAME_LENGTH = 100

/**
 * Sanitiza o conteúdo bruto do .txt em uma lista limpa de nomes:
 * trim, normaliza espaços, descarta linhas vazias e remove duplicatas
 * (case-insensitive), preservando a ordem de primeira ocorrência.
 */
export function parseBulkText(content: string, maxLength = MAX_ITEM_NAME_LENGTH): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const rawLine of content.split(/\r?\n/)) {
    const name = rawLine.trim().replace(/\s+/g, ' ').slice(0, maxLength)
    if (name.length === 0) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

/** Processa um nome de item (buscar na API + registrar). Injetado por quem usa. */
export type BulkItemProcessor = (itemName: string) => Promise<void>

export interface BulkImportResult {
  queued: number
  names: string[]
}

export class BulkImportService {
  constructor(private readonly processItem: BulkItemProcessor) {}

  /**
   * Dispara o processamento de cada nome sanitizado.
   *
   * IMPORTANTE (Bug F2): NÃO envolvemos `processItem` em `queue.enqueue` aqui.
   * O próprio processador já enfileira sua busca (via GnJoyClient) na fila
   * global single-slot. Envolvê-lo de novo causaria reentrância — o job externo
   * ficaria preso aguardando o job interno que só roda quando o externo liberar
   * a fila, travando-a até o timeout de cada item.
   */
  importFromText(content: string): BulkImportResult {
    const names = parseBulkText(content)
    for (const name of names) {
      // A fila interna já reporta erros ao logger; evitamos unhandled rejection.
      void this.processItem(name).catch(() => undefined)
    }
    return { queued: names.length, names }
  }
}
