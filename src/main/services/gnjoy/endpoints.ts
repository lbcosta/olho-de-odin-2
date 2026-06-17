// src/main/services/gnjoy/endpoints.ts
// Construtores de requisição da API GnJoy (URLs, payloads e rótulos).
// Mantém as rotas e formatos da spec (specs/Modules/GnJoy Client/0002) isolados.

import type { ServerType, StoreType } from '@shared/types/domain'

export const GNJOY_BASE_URL = 'https://ro.gnjoylatam.com'

export type HistoryPeriod = '1' | '7' | '30' | 'ALL'

export interface GnJoyEndpoint {
  method: 'GET' | 'POST'
  url: string
  /** Caminho técnico (Developer View do Request Log). */
  path: string
  /** Tradução amigável da ação (visão colapsada). */
  humanAction: string
  /** Payload do Server Action (apenas POST). */
  payload?: unknown
}

function tradingPath(): string {
  return '/pt/intro/shop-search/trading'
}

function marketPricePath(): string {
  return '/pt/intro/shop-search/market-price'
}

/** GET — Busca no Comércio Atual (lojas ativas). */
export function searchActiveEndpoint(query: {
  searchWord: string
  serverType: ServerType
  storeType: StoreType
}): GnJoyEndpoint {
  const params = new URLSearchParams({
    storeType: query.storeType,
    serverType: query.serverType,
    searchWord: query.searchWord,
  })
  const path = `${tradingPath()}?${params.toString()}`
  return {
    method: 'GET',
    url: `${GNJOY_BASE_URL}${path}`,
    path,
    humanAction: `Buscando "${query.searchWord}" no mercado...`,
  }
}

/** GET — Busca no Histórico (fallback quando não há lojas ativas). */
export function searchHistoryEndpoint(query: {
  searchWord: string
  serverType: ServerType
  period?: HistoryPeriod
}): GnJoyEndpoint {
  const params = new URLSearchParams({
    serverType: query.serverType,
    period: query.period ?? 'ALL',
    searchWord: query.searchWord,
  })
  const path = `${marketPricePath()}?${params.toString()}`
  return {
    method: 'GET',
    url: `${GNJOY_BASE_URL}${path}`,
    path,
    humanAction: `Consultando histórico de "${query.searchWord}"...`,
  }
}

/** POST — Detalhes/localização da loja (Lazy Load do card → /navi). */
export function storeLocationEndpoint(params: {
  svrId: number
  mapId: number
  ssi: string
}): GnJoyEndpoint {
  return {
    method: 'POST',
    url: `${GNJOY_BASE_URL}${tradingPath()}`,
    path: `${tradingPath()} [store ${params.ssi}]`,
    humanAction: 'Buscando localização da loja...',
    payload: [{ type: 'store', params }],
  }
}

/** POST — Detalhes do item (slots, refinos, encantamentos). */
export function itemDetailEndpoint(params: {
  svrId: number
  mapId: number
  ssi: string
}): GnJoyEndpoint {
  return {
    method: 'POST',
    url: `${GNJOY_BASE_URL}${tradingPath()}`,
    path: `${tradingPath()} [item ${params.ssi}]`,
    humanAction: 'Buscando detalhes do item...',
    payload: [{ type: 'item', params: { ...params, multiLan: 'en-US' } }],
  }
}

/** POST — Histórico de preço detalhado (gráficos / Média Ponderada). */
export function priceHistoryEndpoint(params: {
  itemId: number
  svrId: number
  page?: number
  limit?: number
}): GnJoyEndpoint {
  return {
    method: 'POST',
    url: `${GNJOY_BASE_URL}${marketPricePath()}`,
    path: `${marketPricePath()} [price ${params.itemId}]`,
    humanAction: 'Atualizando histórico de preços...',
    payload: [
      {
        type: 'price',
        params: {
          itemId: params.itemId,
          svrId: params.svrId,
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          period: '$undefined',
        },
      },
    ],
  }
}
