-- src/main/database/schema.sql
-- Esquema do banco local unificado (olhodeodin.db).
-- Integridade referencial obrigatória + exclusão em cascata.

PRAGMA foreign_keys = ON;

-- Perfis locais (raiz das Foreign Keys). Apenas um ativo por vez.
CREATE TABLE IF NOT EXISTS profiles (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  character_name TEXT,
  is_active      INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo global de itens cadastrados.
CREATE TABLE IF NOT EXISTS items (
  item_id    INTEGER PRIMARY KEY,
  name       TEXT    NOT NULL,
  type       TEXT    NOT NULL DEFAULT '',
  img_path   TEXT    NOT NULL DEFAULT '',
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Watchlist por perfil (profile_id obrigatório; cascata em ambas as FKs).
CREATE TABLE IF NOT EXISTS watchlist (
  profile_id     INTEGER NOT NULL,
  item_id        INTEGER NOT NULL,
  is_monitoring  INTEGER NOT NULL DEFAULT 1,
  is_in_my_store INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, item_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)    REFERENCES items(item_id) ON DELETE CASCADE
);

-- Cache cru de respostas da API (Local-First / tolerância a falhas).
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key  TEXT PRIMARY KEY,
  payload    TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cache de localização por loja (ssi) para o comando /navi:
-- evita bater repetidamente no Rate Limit ao copiar a mesma loja várias vezes.
CREATE TABLE IF NOT EXISTS store_location_cache (
  ssi          TEXT PRIMARY KEY,
  item_id      INTEGER,
  map_name     TEXT NOT NULL,
  xpos         TEXT NOT NULL,
  ypos         TEXT NOT NULL,
  navi_command TEXT NOT NULL,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON watchlist(profile_id);
CREATE INDEX IF NOT EXISTS idx_store_cache_item ON store_location_cache(item_id);
