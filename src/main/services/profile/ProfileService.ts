// src/main/services/profile/ProfileService.ts
// Persistência de Perfis e Watchlist (SQL puro sobre better-sqlite3).
// Regras: ACID via db.transaction() em operações compostas; Foreign Keys com
// ON DELETE CASCADE; I/O de Backup serializando linhas brutas em JSON.
// Injeção de Dependência: recebe a conexão (testável com :memory:).

import { readFileSync, writeFileSync } from 'node:fs'
import type { DatabaseConnection } from '../../database'
import type { Item, Profile, WatchlistEntry } from '@shared/types/domain'

interface ProfileRow {
  id: number
  name: string
  character_name: string | null
  is_active: number
  created_at: string
  updated_at: string
}

interface WatchlistRow {
  profile_id: number
  item_id: number
  is_monitoring: number
  is_in_my_store: number
  created_at: string
}

interface ItemRow {
  item_id: number
  name: string
  type: string
  img_path: string
  updated_at: string
}

export interface CreateProfileInput {
  name: string
  characterName?: string | null
}

export interface UpdateProfileInput {
  id: number
  name?: string
  characterName?: string | null
}

export interface WatchlistItemInput {
  itemId: number
  name: string
  type?: string
  imgPath?: string
  isMonitoring?: boolean
  isInMyStore?: boolean
}

/** Formato do arquivo de Backup (.json) de um Perfil. */
export interface ProfileBackup {
  version: number
  exportedAt: string
  profile: { name: string; characterName: string | null }
  items: Array<Pick<Item, 'itemId' | 'name' | 'type' | 'imgPath'>>
  watchlist: Array<Pick<WatchlistEntry, 'itemId' | 'isMonitoring' | 'isInMyStore'>>
}

export const BACKUP_VERSION = 1

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    characterName: row.character_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toWatchlistEntry(row: WatchlistRow): WatchlistEntry {
  return {
    profileId: row.profile_id,
    itemId: row.item_id,
    isMonitoring: row.is_monitoring === 1,
    isInMyStore: row.is_in_my_store === 1,
    createdAt: row.created_at,
  }
}

export class ProfileService {
  constructor(private readonly db: DatabaseConnection) {}

  // ----- Perfis -----------------------------------------------------------

  list(): Profile[] {
    const rows = this.db
      .prepare('SELECT * FROM profiles ORDER BY created_at ASC, id ASC')
      .all() as ProfileRow[]
    return rows.map(toProfile)
  }

  getById(id: number): Profile | null {
    const row = this.db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as
      | ProfileRow
      | undefined
    return row ? toProfile(row) : null
  }

  getActive(): Profile | null {
    const row = this.db.prepare('SELECT * FROM profiles WHERE is_active = 1 LIMIT 1').get() as
      | ProfileRow
      | undefined
    return row ? toProfile(row) : null
  }

  create(input: CreateProfileInput): Profile {
    const name = input.name.trim()
    if (name.length === 0) {
      throw new Error('O nome do Perfil é obrigatório.')
    }
    // Primeiro perfil criado já nasce ativo.
    const isFirst =
      (this.db.prepare('SELECT COUNT(*) AS n FROM profiles').get() as { n: number }).n === 0
    const info = this.db
      .prepare('INSERT INTO profiles (name, character_name, is_active) VALUES (?, ?, ?)')
      .run(name, input.characterName?.trim() || null, isFirst ? 1 : 0)
    return this.getById(Number(info.lastInsertRowid))!
  }

  update(input: UpdateProfileInput): Profile {
    const existing = this.getById(input.id)
    if (!existing) throw new Error(`Perfil ${input.id} não encontrado.`)

    const name = input.name === undefined ? existing.name : input.name.trim()
    if (name.length === 0) throw new Error('O nome do Perfil é obrigatório.')
    const characterName =
      input.characterName === undefined
        ? existing.characterName
        : input.characterName?.trim() || null

    this.db
      .prepare(
        `UPDATE profiles SET name = ?, character_name = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(name, characterName, input.id)
    return this.getById(input.id)!
  }

  /** Define o perfil ativo de forma exclusiva (transação ACID). */
  setActive(id: number): void {
    const exists = this.getById(id)
    if (!exists) throw new Error(`Perfil ${id} não encontrado.`)
    const tx = this.db.transaction((profileId: number) => {
      this.db.prepare('UPDATE profiles SET is_active = 0 WHERE is_active = 1').run()
      this.db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(profileId)
    })
    tx(id)
  }

  /** Exclui um Perfil; a Watchlist é removida por ON DELETE CASCADE. */
  delete(id: number): void {
    const tx = this.db.transaction((profileId: number) => {
      const wasActive = this.db
        .prepare('SELECT is_active FROM profiles WHERE id = ?')
        .get(profileId) as { is_active: number } | undefined
      this.db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId)
      // Se excluímos o ativo, promove o perfil mais antigo restante.
      if (wasActive?.is_active === 1) {
        const next = this.db
          .prepare('SELECT id FROM profiles ORDER BY created_at ASC, id ASC LIMIT 1')
          .get() as { id: number } | undefined
        if (next) this.db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(next.id)
      }
    })
    tx(id)
  }

  // ----- Watchlist --------------------------------------------------------

  listWatchlist(profileId: number): WatchlistEntry[] {
    const rows = this.db
      .prepare('SELECT * FROM watchlist WHERE profile_id = ? ORDER BY created_at ASC')
      .all(profileId) as WatchlistRow[]
    return rows.map(toWatchlistEntry)
  }

  /** Garante o item no catálogo e o vincula à Watchlist do perfil (idempotente). */
  addToWatchlist(profileId: number, item: WatchlistItemInput): WatchlistEntry {
    const tx = this.db.transaction(() => {
      this.upsertItem(item)
      this.db
        .prepare(
          `INSERT INTO watchlist (profile_id, item_id, is_monitoring, is_in_my_store)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(profile_id, item_id) DO UPDATE SET
             is_monitoring = excluded.is_monitoring,
             is_in_my_store = excluded.is_in_my_store`,
        )
        .run(profileId, item.itemId, item.isMonitoring === false ? 0 : 1, item.isInMyStore ? 1 : 0)
    })
    tx()
    const row = this.db
      .prepare('SELECT * FROM watchlist WHERE profile_id = ? AND item_id = ?')
      .get(profileId, item.itemId) as WatchlistRow
    return toWatchlistEntry(row)
  }

  removeFromWatchlist(profileId: number, itemId: number): void {
    this.db
      .prepare('DELETE FROM watchlist WHERE profile_id = ? AND item_id = ?')
      .run(profileId, itemId)
  }

  setMonitoring(profileId: number, itemId: number, enabled: boolean): void {
    this.db
      .prepare('UPDATE watchlist SET is_monitoring = ? WHERE profile_id = ? AND item_id = ?')
      .run(enabled ? 1 : 0, profileId, itemId)
  }

  setInMyStore(profileId: number, itemId: number, enabled: boolean): void {
    this.db
      .prepare('UPDATE watchlist SET is_in_my_store = ? WHERE profile_id = ? AND item_id = ?')
      .run(enabled ? 1 : 0, profileId, itemId)
  }

  /** Busca um item do catálogo global. */
  getItem(itemId: number): Item | null {
    const row = this.db.prepare('SELECT * FROM items WHERE item_id = ?').get(itemId) as
      | ItemRow
      | undefined
    return row
      ? {
          itemId: row.item_id,
          name: row.name,
          type: row.type,
          imgPath: row.img_path,
          updatedAt: row.updated_at,
        }
      : null
  }

  /** Cadastra/atualiza um item no catálogo (sem vincular à Watchlist). */
  registerItem(item: WatchlistItemInput): void {
    this.upsertItem(item)
  }

  /** Atualiza o carimbo de sincronização (`updated_at`) de um item. */
  touchItem(itemId: number): void {
    this.db.prepare("UPDATE items SET updated_at = datetime('now') WHERE item_id = ?").run(itemId)
  }

  private upsertItem(item: WatchlistItemInput): void {
    this.db
      .prepare(
        `INSERT INTO items (item_id, name, type, img_path, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'))
         ON CONFLICT(item_id) DO UPDATE SET
           name = excluded.name, type = excluded.type,
           img_path = excluded.img_path, updated_at = excluded.updated_at`,
      )
      .run(item.itemId, item.name, item.type ?? '', item.imgPath ?? '')
  }

  // ----- Backup (Export / Import JSON) -----------------------------------

  /** Serializa o Perfil + Watchlist + itens referenciados em um objeto de Backup. */
  exportProfile(profileId: number): ProfileBackup {
    const profile = this.getById(profileId)
    if (!profile) throw new Error(`Perfil ${profileId} não encontrado.`)

    const watchlist = this.listWatchlist(profileId)
    const items = this.db
      .prepare(
        `SELECT i.* FROM items i
         JOIN watchlist w ON w.item_id = i.item_id
         WHERE w.profile_id = ?`,
      )
      .all(profileId) as ItemRow[]

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      profile: { name: profile.name, characterName: profile.characterName },
      items: items.map((i) => ({
        itemId: i.item_id,
        name: i.name,
        type: i.type,
        imgPath: i.img_path,
      })),
      watchlist: watchlist.map((w) => ({
        itemId: w.itemId,
        isMonitoring: w.isMonitoring,
        isInMyStore: w.isInMyStore,
      })),
    }
  }

  /** Restaura um Perfil a partir de um Backup, atomicamente (tudo-ou-nada). */
  importProfile(backup: ProfileBackup): Profile {
    if (!backup || typeof backup !== 'object' || !backup.profile?.name) {
      throw new Error('Arquivo de Backup inválido.')
    }
    const tx = this.db.transaction((data: ProfileBackup): number => {
      const info = this.db
        .prepare('INSERT INTO profiles (name, character_name, is_active) VALUES (?, ?, 0)')
        .run(data.profile.name, data.profile.characterName ?? null)
      const profileId = Number(info.lastInsertRowid)

      for (const item of data.items ?? []) {
        this.upsertItem({
          itemId: item.itemId,
          name: item.name,
          type: item.type,
          imgPath: item.imgPath,
        })
      }
      for (const entry of data.watchlist ?? []) {
        this.db
          .prepare(
            `INSERT INTO watchlist (profile_id, item_id, is_monitoring, is_in_my_store)
             VALUES (?, ?, ?, ?)`,
          )
          .run(profileId, entry.itemId, entry.isMonitoring ? 1 : 0, entry.isInMyStore ? 1 : 0)
      }
      return profileId
    })
    const newId = tx(backup)
    return this.getById(newId)!
  }

  exportToFile(profileId: number, filePath: string): string {
    const backup = this.exportProfile(profileId)
    writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')
    return filePath
  }

  importFromFile(filePath: string): Profile {
    const backup = JSON.parse(readFileSync(filePath, 'utf-8')) as ProfileBackup
    return this.importProfile(backup)
  }
}
