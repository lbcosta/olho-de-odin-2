// src/main/services/search/BulkImport.ts
// Importação em Massa via .txt (1 nome de item por linha).
// Higieniza as linhas e enfileira uma busca por item na fila global com
// Prioridade BAIXA (não atrapalha comandos do usuário nem a Watchlist).

import { readFileSync } from 'node:fs'
import type { RequestQueueManager } from '../gnjoy/RequestQueueManager'

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
  constructor(
    private readonly queue: RequestQueueManager,
    private readonly processItem: BulkItemProcessor,
  ) {}

  /** Enfileira (Prioridade BAIXA) uma tarefa de busca por nome sanitizado. */
  importFromText(content: string): BulkImportResult {
    const names = parseBulkText(content)
    for (const name of names) {
      void this.queue
        .enqueue(() => this.processItem(name), {
          method: 'GET',
          path: '/pt/intro/shop-search/trading',
          humanAction: `Importando "${name}"...`,
          priority: 'LOW',
        })
        // A fila já reporta o erro ao logger; aqui evitamos unhandled rejection.
        .catch(() => undefined)
    }
    return { queued: names.length, names }
  }

  importFromFile(filePath: string): BulkImportResult {
    return this.importFromText(readFileSync(filePath, 'utf-8'))
  }
}
