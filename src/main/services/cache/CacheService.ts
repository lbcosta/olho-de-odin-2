// src/main/services/cache/CacheService.ts
// Cache Local-First: persiste payloads crus/derivados (api_cache) e a
// localização de lojas por ssi (store_location_cache) para o comando /navi,
// evitando bater repetidamente no Rate Limit.

import type { DatabaseConnection } from '../../database'
import type { StoreLocation } from '@shared/types/domain'
import { formatNaviCommand } from '@shared/navi'

export interface CachedValue<T> {
  value: T
  updatedAt: string
}

export interface CachedNavi {
  ssi: string
  mapName: string
  xpos: string
  ypos: string
  naviCommand: string
  updatedAt: string
}

export class CacheService {
  constructor(private readonly db: DatabaseConnection) {}

  set(key: string, value: unknown): void {
    this.db
      .prepare(
        `INSERT INTO api_cache (cache_key, payload, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(key, JSON.stringify(value))
  }

  get<T>(key: string): CachedValue<T> | null {
    const row = this.db
      .prepare('SELECT payload, updated_at FROM api_cache WHERE cache_key = ?')
      .get(key) as { payload: string; updated_at: string } | undefined
    if (!row) return null
    return { value: JSON.parse(row.payload) as T, updatedAt: row.updated_at }
  }

  getStoreLocation(ssi: string): CachedNavi | null {
    const row = this.db.prepare('SELECT * FROM store_location_cache WHERE ssi = ?').get(ssi) as
      | {
          ssi: string
          map_name: string
          xpos: string
          ypos: string
          navi_command: string
          updated_at: string
        }
      | undefined
    if (!row) return null
    return {
      ssi: row.ssi,
      mapName: row.map_name,
      xpos: row.xpos,
      ypos: row.ypos,
      naviCommand: row.navi_command,
      updatedAt: row.updated_at,
    }
  }

  setStoreLocation(loc: StoreLocation): CachedNavi {
    const naviCommand = formatNaviCommand(loc)
    this.db
      .prepare(
        `INSERT INTO store_location_cache (ssi, item_id, map_name, xpos, ypos, navi_command, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(ssi) DO UPDATE SET
           item_id = excluded.item_id, map_name = excluded.map_name,
           xpos = excluded.xpos, ypos = excluded.ypos,
           navi_command = excluded.navi_command, updated_at = excluded.updated_at`,
      )
      .run(loc.ssi, loc.itemId, loc.mapName, loc.xpos, loc.ypos, naviCommand)
    return this.getStoreLocation(loc.ssi) as CachedNavi
  }
}
