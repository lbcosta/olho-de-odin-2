// src/shared/types/domain.ts
// Modelo de domínio compartilhado entre Main, Preload e Renderer.
// Os formatos espelham os payloads reais da API GnJoy (ver specs/Docs/gnjoylatam.api.md)
// e as entidades persistidas localmente no SQLite.

/** Servidores disponíveis na GnJoy LATAM. */
export type ServerType = 'NIDHOGG' | 'FREYA'

/** Tipo de loja na busca de comércio ativo. */
export type StoreType = 'BUY' | 'SELL'

// ---------------------------------------------------------------------------
// API GnJoy — formatos brutos relevantes (já "mastigados" pelo parser)
// ---------------------------------------------------------------------------

/** Uma loja ativa vendendo o item agora (Endpoint 1 — GET trading). */
export interface ActiveStoreListing {
  svrId: number
  itemId: number
  mapId: number
  /** Identificador único da loja/anúncio usado nas requisições Lazy Load. */
  ssi: string
  itemName: string
  databaseImgPath: string
  databaseType: string
  storeName: string
  itemPrice: number
  itemCnt: number
  slotMaxCount: string | number
  storeTypeName: StoreType
  itemSellerCharName: string
}

/** Resumo histórico agregado (Endpoint 3 — GET market-price). */
export interface HistoricalSummary {
  svrId: number
  itemId: number
  mapId: number
  ssi: string
  itemName: string
  databaseImgPath: string
  databaseType: string
  totalItemCnt: number
  minItemPrice: number
  maxItemPrice: number
  avgItemPrice: number
}

/** Ponto diário do gráfico de preço (priceDetailChartList). */
export interface PriceChartPoint {
  nowDate: string
  minItemPrice: number
  maxItemPrice: number
  avgItemPrice: number
}

/** Dado diário com volume — base da Média Ponderada Real (priceDetailDayList). */
export interface PriceDay {
  nowDate: string
  minItemPrice: number
  maxItemPrice: number
  avgItemPrice: number
  itemCnt: number
  totalCount: number
}

/** Histórico de preço completo (Endpoint 6 — POST price). */
export interface PriceHistory {
  itemPriceMin: number
  itemPriceMax: number
  priceDetailChartList: PriceChartPoint[]
  priceDetailDayList: PriceDay[]
}

/** Localização exata da loja (POST store) — base do comando `/navi`. */
export interface StoreLocation {
  svrId: number
  svrName: string
  itemId: number
  mapId: number
  ssi: string
  storeName: string
  mapName: string
  itemSellerCharName: string
  itemFullName: string
  itemPrice: number
  marketStoreTypeCode: StoreType
  itemCnt: number
  databaseImgPath: string
  databaseType: string
  xpos: string
  ypos: string
}

// ---------------------------------------------------------------------------
// Entidades persistidas localmente (SQLite)
// ---------------------------------------------------------------------------

/** Perfil local do usuário (raiz das Foreign Keys). */
export interface Profile {
  id: number
  name: string
  /** Nome do personagem in-game; chave do recurso "Minha Loja". */
  characterName: string | null
  createdAt: string
  updatedAt: string
}

/** Item cadastrado no banco local. */
export interface Item {
  itemId: number
  name: string
  type: string
  imgPath: string
  /** Última sincronização bem-sucedida (Local-First). */
  updatedAt: string
}

/** Vínculo de um item à Watchlist de um Perfil. */
export interface WatchlistEntry {
  profileId: number
  itemId: number
  isMonitoring: boolean
  /** Marca o item como pertencente à "Minha Loja" (prioridade máxima na fila). */
  isInMyStore: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Métricas e Estratégias (Sales Metrics)
// ---------------------------------------------------------------------------

export interface MarketMetrics {
  /** Média Ponderada Real dos últimos 7 dias. */
  weightedAveragePrice: number
  /** Diferença entre maior e menor preço ativo. */
  currentSpread: number
  /** Pressão da Concorrência (saturação): estoque ativo / média diária vendida. */
  competitionPressure: number
  /** Menor preço ativo no mercado atual. */
  lowestActivePrice: number
}

/** Tags de status de mercado (cruzamento das métricas puras). */
export type MarketStatus = 'HOT_ITEM' | 'SATURATED' | 'VOLATILE' | 'CRASH' | 'STABLE'

/** Estratégias de precificação sugeridas. */
export type PricingStrategy = 'UNDERCUTTING' | 'PREMIUM' | 'FLIPPING'

export interface StrategySuggestion {
  strategy: PricingStrategy
  /** Preço sugerido pela estratégia (quando aplicável). */
  suggestedPrice: number | null
  reason: string
}

export interface MarketAnalysis {
  metrics: MarketMetrics
  statuses: MarketStatus[]
  strategies: StrategySuggestion[]
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Request Log / Fila Global
// ---------------------------------------------------------------------------

export type RequestPriority = 'HIGH' | 'NORMAL' | 'LOW'
export type RequestMethod = 'GET' | 'POST'

/** Estado de uma requisição no `RequestQueueManager`. */
export type RequestLogStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'ERROR'

export interface RequestLogEntry {
  id: string
  method: RequestMethod
  /** Path técnico completo acionado na GnJoy (visão de desenvolvedor). */
  path: string
  status: RequestLogStatus
  httpStatus: number | null
  /** Tradução amigável da tarefa para o usuário comum. */
  humanAction: string
  priority: RequestPriority
  /** Epoch em ms. */
  timestamp: number
}

export interface QueueStatus {
  pending: number
  isProcessing: boolean
  currentAction: string | null
}
