// tests/main/profile.spec.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDatabase, type DatabaseConnection } from '@main/database'
import { applySchema } from '@main/database/migrate'
import { ProfileService } from '@main/services/profile/ProfileService'

let db: DatabaseConnection
let service: ProfileService

beforeEach(() => {
  db = createDatabase(':memory:')
  applySchema(db)
  service = new ProfileService(db)
})

afterEach(() => {
  db.close()
})

describe('CRUD de Perfis', () => {
  it('cria e lista perfis; o primeiro nasce ativo', () => {
    const p = service.create({ name: 'Mercador', characterName: 'Odin' })
    expect(p.id).toBeGreaterThan(0)
    expect(service.getActive()?.id).toBe(p.id)
    expect(service.list()).toHaveLength(1)
  })

  it('exige nome não-vazio', () => {
    expect(() => service.create({ name: '   ' })).toThrowError(/obrigatório/i)
  })

  it('atualiza nome e personagem', () => {
    const p = service.create({ name: 'A' })
    const updated = service.update({ id: p.id, name: 'B', characterName: 'Char' })
    expect(updated.name).toBe('B')
    expect(updated.characterName).toBe('Char')
  })

  it('setActive ativa exclusivamente um perfil', () => {
    const a = service.create({ name: 'A' })
    const b = service.create({ name: 'B' })
    service.setActive(b.id)
    expect(service.getActive()?.id).toBe(b.id)
    expect(service.getById(a.id)).toBeTruthy()
    expect(service.list().filter((p) => service.getActive()?.id === p.id)).toHaveLength(1)
  })
})

describe('Foreign Keys e Cascata', () => {
  it('excluir um perfil remove sua watchlist (ON DELETE CASCADE)', () => {
    const p = service.create({ name: 'A' })
    service.addToWatchlist(p.id, { itemId: 1100003, name: 'Elixir' })
    expect(service.listWatchlist(p.id)).toHaveLength(1)

    service.delete(p.id)

    const remaining = db.prepare('SELECT COUNT(*) AS n FROM watchlist').get() as { n: number }
    expect(remaining.n).toBe(0)
  })

  it('rejeita watchlist para item inexistente quando não há upsert (FK enforce)', () => {
    const p = service.create({ name: 'A' })
    expect(() =>
      db.prepare('INSERT INTO watchlist (profile_id, item_id) VALUES (?, ?)').run(p.id, 999999),
    ).toThrowError(/FOREIGN KEY/i)
  })

  it('promove outro perfil quando o ativo é excluído', () => {
    const a = service.create({ name: 'A' }) // ativo
    const b = service.create({ name: 'B' })
    service.delete(a.id)
    expect(service.getActive()?.id).toBe(b.id)
  })
})

describe('Watchlist', () => {
  it('addToWatchlist faz upsert do item e do vínculo (idempotente)', () => {
    const p = service.create({ name: 'A' })
    service.addToWatchlist(p.id, { itemId: 1, name: 'Item', isInMyStore: true })
    const entry = service.addToWatchlist(p.id, { itemId: 1, name: 'Item', isInMyStore: false })
    expect(service.listWatchlist(p.id)).toHaveLength(1)
    expect(entry.isInMyStore).toBe(false)
  })

  it('alterna monitoramento e flag Minha Loja', () => {
    const p = service.create({ name: 'A' })
    service.addToWatchlist(p.id, { itemId: 1, name: 'Item' })
    service.setMonitoring(p.id, 1, false)
    service.setInMyStore(p.id, 1, true)
    const [entry] = service.listWatchlist(p.id)
    expect(entry.isMonitoring).toBe(false)
    expect(entry.isInMyStore).toBe(true)
  })
})

describe('Backup (Export / Import JSON)', () => {
  it('exporta perfil com itens e watchlist e reimporta fielmente', () => {
    const p = service.create({ name: 'Origem', characterName: 'Odin' })
    service.addToWatchlist(p.id, { itemId: 1100003, name: 'Elixir', isInMyStore: true })
    service.addToWatchlist(p.id, { itemId: 909, name: 'Jellopy' })

    const backup = service.exportProfile(p.id)
    expect(backup.items).toHaveLength(2)
    expect(backup.watchlist).toHaveLength(2)

    const imported = service.importProfile(backup)
    expect(imported.id).not.toBe(p.id)
    expect(imported.name).toBe('Origem')
    const importedWatch = service.listWatchlist(imported.id)
    expect(importedWatch).toHaveLength(2)
    expect(importedWatch.find((w) => w.itemId === 1100003)?.isInMyStore).toBe(true)
  })

  it('importação é atômica: falha no meio não deixa perfil órfão (ACID)', () => {
    const before = service.list().length
    // watchlist referencia item ausente em `items` => viola FK no meio da transação
    const corrupt = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: { name: 'Corrompido', characterName: null },
      items: [],
      watchlist: [{ itemId: 424242, isMonitoring: true, isInMyStore: false }],
    }
    expect(() => service.importProfile(corrupt)).toThrowError(/FOREIGN KEY/i)
    expect(service.list()).toHaveLength(before) // rollback total
  })
})
