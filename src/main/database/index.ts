// src/main/database/index.ts
// Instância síncrona do better-sqlite3, hospedada exclusivamente no Main Process.
//
// Decisão arquitetural: este módulo NÃO importa `electron` no topo, para que a
// lógica (abertura de conexão + PRAGMAs) seja testável sob Node puro (Vitest).
// O caminho do arquivo é injetado pelo chamador (`initDatabase`); os testes
// usam `createDatabase(':memory:')`.

import Database from 'better-sqlite3'

export type DatabaseConnection = Database.Database

/** Nome canônico do banco local unificado. */
export const DB_FILENAME = 'olhodeodin.db'

let instance: DatabaseConnection | null = null

/**
 * Cria uma NOVA conexão SQLite já configurada.
 * - `foreign_keys = ON`  -> integridade referencial / ON DELETE CASCADE.
 * - `journal_mode = WAL` -> leituras concorrentes + durabilidade (ignorado em `:memory:`).
 * - `synchronous = NORMAL` -> bom equilíbrio durabilidade/performance em WAL.
 *
 * @param filename Caminho do arquivo `.db` ou `':memory:'`.
 */
export function createDatabase(filename: string): DatabaseConnection {
  const db = new Database(filename)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  return db
}

/**
 * Inicializa o singleton do banco (idempotente). Deve ser chamado uma vez no
 * boot do Main Process com o caminho real (ex: userData/olhodeodin.db).
 */
export function initDatabase(filename: string): DatabaseConnection {
  if (!instance) {
    instance = createDatabase(filename)
  }
  return instance
}

/**
 * Retorna o singleton já inicializado.
 * @throws se chamado antes de `initDatabase`.
 */
export function getDatabase(): DatabaseConnection {
  if (!instance) {
    throw new Error(
      'Banco de dados não inicializado. Chame initDatabase(caminho) no boot do Main Process.',
    )
  }
  return instance
}

/** Fecha e descarta o singleton (uso em shutdown e em testes). */
export function closeDatabase(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}
