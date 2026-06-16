// tests/main/database.spec.ts
import { afterEach, describe, expect, it } from 'vitest'
import { closeDatabase, createDatabase, getDatabase, initDatabase } from '@main/database'

afterEach(() => {
  closeDatabase()
})

describe('database (better-sqlite3)', () => {
  it('habilita PRAGMA foreign_keys ao abrir a conexão', () => {
    const db = createDatabase(':memory:')
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    db.close()
  })

  it('aplica ON DELETE CASCADE respeitando as foreign keys', () => {
    const db = createDatabase(':memory:')
    db.exec(`
      CREATE TABLE profiles (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE watchlist (
        profile_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      );
    `)
    db.prepare('INSERT INTO profiles (id, name) VALUES (1, ?)').run('Mercador')
    db.prepare('INSERT INTO watchlist (profile_id, item_id) VALUES (1, 1100003)').run()

    db.prepare('DELETE FROM profiles WHERE id = 1').run()

    const remaining = db.prepare('SELECT COUNT(*) AS n FROM watchlist').get() as { n: number }
    expect(remaining.n).toBe(0)
    db.close()
  })

  it('getDatabase lança erro antes da inicialização', () => {
    expect(() => getDatabase()).toThrowError(/não inicializado/i)
  })

  it('initDatabase é idempotente (mesma instância singleton)', () => {
    const first = initDatabase(':memory:')
    const second = initDatabase(':memory:')
    expect(second).toBe(first)
    expect(getDatabase()).toBe(first)
  })
})
