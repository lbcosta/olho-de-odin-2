// src/main/database/migrate.ts
// Aplica o esquema SQL (idempotente). Versão registrada em PRAGMA user_version
// para futuras migrações incrementais.

import type { DatabaseConnection } from './index'
import schema from './schema.sql?raw'

export const SCHEMA_VERSION = 1

/** Cria as tabelas se necessário e marca a versão do esquema. */
export function applySchema(db: DatabaseConnection): void {
  db.exec(schema)
  db.pragma(`user_version = ${SCHEMA_VERSION}`)
}

/** Versão atual do esquema gravada no arquivo do banco. */
export function getSchemaVersion(db: DatabaseConnection): number {
  return db.pragma('user_version', { simple: true }) as number
}
