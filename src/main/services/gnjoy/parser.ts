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
//
// O ID da Server Action (`Next-Action`) é um caso aparte: NÃO vem no corpo RSC
// do GET, vem embutido num chunk JS da página (`createServerReference("id",..)`).
// A extração desse texto de framework (sem caracteres especiais de usuário) usa
// busca por marcador fixo (`indexOf`), não Regex de captura — ver seção própria.

import type {
  ActiveStoreListing,
  HistoricalSummary,
  PriceHistory,
  StoreItemDetail,
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

/** Envelope de uma resposta POST (Server Action): `{success, data?}`. */
export interface ActionEnvelope {
  success: boolean
  data: Record<string, unknown> | null
}

/**
 * Localiza o envelope de uma resposta POST (Server Action).
 * Retorna `null` quando a resposta NÃO contém envelope nenhum — sinal de que a
 * sessão (hash `Next-Action`) está inválida e o servidor caiu no fallback de
 * página inteira. Distinto de `{success:false}`, que é uma resposta de ação
 * VÁLIDA cujo recurso não foi encontrado (ex.: anúncio de loja expirado).
 */
function findActionEnvelope(raw: string): ActionEnvelope | null {
  for (const value of parseRscValues(raw)) {
    if (isRecord(value) && 'success' in value) {
      return { success: value.success === true, data: isRecord(value.data) ? value.data : null }
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

/**
 * Envelope de uma resposta POST. `null` => sessão inválida (fallback de
 * página inteira). Usado pelo `GnJoyClient` para decidir o auto-renew.
 */
export function parseActionEnvelope(raw: string): ActionEnvelope | null {
  return findActionEnvelope(raw)
}

/** Resumos agregados da Busca no Histórico (GET market-price). */
export function parseHistoricalSummaries(raw: string): HistoricalSummary[] {
  return findEmbeddedList(raw) as HistoricalSummary[]
}

/** Localização da loja (POST store) — base do comando `/navi`. `null` se o anúncio expirou. */
export function parseStoreLocation(raw: string): StoreLocation | null {
  const data = findActionEnvelope(raw)?.data
  return data ? (data as unknown as StoreLocation) : null
}

/** Histórico de preço detalhado (POST price). */
export function parsePriceHistory(raw: string): PriceHistory | null {
  const data = findActionEnvelope(raw)?.data
  if (!data || !Array.isArray((data as Record<string, unknown>).priceDetailDayList)) {
    return null
  }
  return data as unknown as PriceHistory
}

/** Detalhe do item de uma loja (POST item) — cartas/encantamentos. `null` se expirou. */
export function parseItemDetail(raw: string): StoreItemDetail | null {
  const data = findActionEnvelope(raw)?.data
  return data ? (data as unknown as StoreItemDetail) : null
}

// ---------------------------------------------------------------------------
// Descoberta do ID da Server Action (`Next-Action`)
// ---------------------------------------------------------------------------
//
// O hash NÃO vem no corpo RSC do GET — ele é uma constante de build embutida
// num chunk JS da página, referenciada via `createServerReference(...)`.
// Por isso a descoberta tem duas etapas: (1) localizar os caminhos de chunk
// citados na árvore RSC, (2) varrer o conteúdo de cada chunk até achar a chamada.

/**
 * Localiza, sem Regex, os caminhos de chunk JS (`static/chunks/...js`)
 * referenciados na árvore RSC — candidatos a conter a Server Action.
 */
export function extractChunkPaths(raw: string): string[] {
  const MARKER = 'static/chunks/'
  const SUFFIX = '.js'
  const paths: string[] = []
  let from = 0
  while (true) {
    const start = raw.indexOf(MARKER, from)
    if (start === -1) break
    const end = raw.indexOf(SUFFIX, start)
    if (end === -1) break
    paths.push(raw.slice(start, end + SUFFIX.length))
    from = end + SUFFIX.length
  }
  return [...new Set(paths)]
}

/**
 * Extrai, sem Regex, o ID de Server Action embutido num chunk JS via
 * `createServerReference(...)`. Bundlers minificam a chamada como
 * `(0,r.createServerReference)("<id>",...)` — por isso busca-se a PRIMEIRA
 * aspas após o nome da função, em vez de exigir um `("` colado. O comprimento
 * do ID NÃO é fixo (varia por build/ação) — valida-se só que é hex não-vazio.
 */
export function extractActionHash(js: string): string | null {
  const MARKER = 'createServerReference'
  const start = js.indexOf(MARKER)
  if (start === -1) return null
  const quoteStart = js.indexOf('"', start + MARKER.length)
  if (quoteStart === -1) return null
  const quoteEnd = js.indexOf('"', quoteStart + 1)
  if (quoteEnd === -1) return null
  const candidate = js.slice(quoteStart + 1, quoteEnd)
  return candidate.length > 0 && isHexString(candidate) ? candidate : null
}

function isHexString(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (!isHexChar(s[i])) return false
  }
  return true
}

function isHexChar(ch: string): boolean {
  return (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')
}
