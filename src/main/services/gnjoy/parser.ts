// src/main/services/gnjoy/parser.ts
// Parser Anti-Regex dos retornos RSC (React Server Components) da GnJoy.
//
// Regra de ouro: NUNCA usar Regex para capturar valores. Nomes de itens e lojas
// contêm aspas, vírgulas e parênteses que quebram qualquer Regex. A extração
// localiza cada linha pelo seu prefixo numérico (ex.: `10:`, `1:`, `0:`), corta
// tudo até o primeiro `:` e aplica `JSON.parse()` nativo no restante.
//
// A localização dos dados é feita por FORMATO (shape), não por prefixo fixo,
// para resistir a mudanças de ordem das chaves do Next.js.

import type {
  ActiveStoreListing,
  HistoricalSummary,
  PriceHistory,
  StoreLocation,
} from '@shared/types/domain'

type RscValue = unknown

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Decodifica todas as linhas RSC que sejam JSON válido.
 * Linhas de módulo/cliente (ex.: `f:I[33485,...]`) não são JSON e são ignoradas.
 */
export function parseRscValues(raw: string): RscValue[] {
  const values: RscValue[] = []
  for (const line of raw.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const payload = line.slice(colon + 1)
    if (payload.length === 0) continue
    try {
      values.push(JSON.parse(payload))
    } catch {
      // Não é JSON (linha de referência de módulo/RSC) — ignora silenciosamente.
    }
  }
  return values
}

/**
 * Mapa `prefixo -> valor JSON` das linhas RSC. Útil quando o prefixo importa.
 * Para extração de dados prefira as funções por formato abaixo.
 */
export function parseRscLines(raw: string): Map<string, RscValue> {
  const map = new Map<string, RscValue>()
  for (const line of raw.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const prefix = line.slice(0, colon)
    const payload = line.slice(colon + 1)
    if (payload.length === 0) continue
    try {
      map.set(prefix, JSON.parse(payload))
    } catch {
      // ignora linhas não-JSON
    }
  }
  return map
}

/**
 * Localiza o array `list` embutido na linha de página (GET de busca/histórico):
 * `["$","$L12",null,{ "queryParams":..., "list":[...], "totalCount":N }]`.
 */
function findEmbeddedList(raw: string): unknown[] {
  for (const value of parseRscValues(raw)) {
    if (Array.isArray(value)) {
      const props = value[3]
      if (isRecord(props) && Array.isArray(props.list)) {
        return props.list
      }
    }
  }
  return []
}

/**
 * Localiza o objeto de dados das respostas POST (Server Actions):
 * `{ "data": {...}, "success": true }`.
 */
function findActionData(raw: string): Record<string, unknown> | null {
  for (const value of parseRscValues(raw)) {
    if (isRecord(value) && 'success' in value && isRecord(value.data)) {
      return value.data
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Extratores tipados por endpoint
// ---------------------------------------------------------------------------

/** Lojas ativas da Busca no Comércio Atual (GET trading). */
export function parseActiveListings(raw: string): ActiveStoreListing[] {
  return findEmbeddedList(raw) as ActiveStoreListing[]
}

/** Resumos agregados da Busca no Histórico (GET market-price). */
export function parseHistoricalSummaries(raw: string): HistoricalSummary[] {
  return findEmbeddedList(raw) as HistoricalSummary[]
}

/** Localização da loja (POST store) — base do comando `/navi`. */
export function parseStoreLocation(raw: string): StoreLocation | null {
  const data = findActionData(raw)
  return data ? (data as unknown as StoreLocation) : null
}

/** Histórico de preço detalhado (POST price). */
export function parsePriceHistory(raw: string): PriceHistory | null {
  const data = findActionData(raw)
  if (!data || !Array.isArray((data as Record<string, unknown>).priceDetailDayList)) {
    return null
  }
  return data as unknown as PriceHistory
}

/**
 * Extração best-effort do hash dinâmico `Next-Action` (Server Action, 40 hex).
 * A GnJoy entrega esse identificador no fluxo RSC/headers do GET inicial; como o
 * formato varia entre publicações, varre-se a string SEM Regex (run de hex
 * maximal de exatamente 40 caracteres). Retorna `null` se ausente.
 */
export function extractNextAction(raw: string): string | null {
  const HASH_LEN = 40
  let run = ''
  for (let i = 0; i <= raw.length; i++) {
    const ch = i < raw.length ? raw[i] : ''
    if (isHexChar(ch)) {
      run += ch
    } else {
      // Fim de um run: só aceita se for um hash maximal de exatamente 40 hex.
      if (run.length === HASH_LEN) return run
      run = ''
    }
  }
  return null
}

function isHexChar(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
}
