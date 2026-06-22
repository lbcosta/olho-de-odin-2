// src/shared/types/ipc.ts
// Contrato IPC estrito — a ÚNICA fonte da verdade para a comunicação
// Renderer <-> Main. Cada canal mapeia um `request` e um `response`.
// O preload (`window.api`) e os handlers do Main derivam seus tipos daqui,
// garantindo que um erro de payload seja um erro de compilação.

import type {
  ActiveStoreListing,
  Item,
  MarketAnalysis,
  Profile,
  QueueStatus,
  RequestLogEntry,
  ServerType,
  StoreItemDetail,
  StoreLocation,
  StoreType,
  WatchlistEntry,
} from './domain'

// ---------------------------------------------------------------------------
// Canais invocáveis (Renderer -> Main, request/response via ipcRenderer.invoke)
// ---------------------------------------------------------------------------

export const IpcChannel = {
  // Sistema / diagnóstico (implementados na Fase 1)
  SystemPing: 'system:ping',
  SystemGetAppInfo: 'system:get-app-info',

  // Diálogos nativos (Fase 3.5)
  DialogPickSave: 'dialog:pick-save',
  DialogPickOpen: 'dialog:pick-open',

  // Busca (Fase 3)
  SearchItems: 'search:items',

  // Item (Fase 3)
  ItemGetDetails: 'item:get-details',
  ItemSync: 'item:sync',
  ItemExpandStore: 'item:expand-store',
  ItemExpandDetail: 'item:expand-detail',

  // Watchlist (Fase 3)
  WatchlistList: 'watchlist:list',
  WatchlistAdd: 'watchlist:add',
  WatchlistRemove: 'watchlist:remove',
  WatchlistSetMonitoring: 'watchlist:set-monitoring',
  WatchlistSetInMyStore: 'watchlist:set-in-my-store',
  WatchlistBulkImport: 'watchlist:bulk-import',
  // Master Switch do ciclo de polling, agora hospedado no Main (Bug #2b).
  WatchlistSetMonitoringMaster: 'watchlist:set-monitoring-master',
  WatchlistGetMonitoringMaster: 'watchlist:get-monitoring-master',

  // Profile (Fase 2)
  ProfileList: 'profile:list',
  ProfileGetActive: 'profile:get-active',
  ProfileSetActive: 'profile:set-active',
  ProfileCreate: 'profile:create',
  ProfileUpdate: 'profile:update',
  ProfileDelete: 'profile:delete',
  ProfileExport: 'profile:export',
  ProfileImport: 'profile:import',

  // Métricas (Fase 2)
  MetricsCompute: 'metrics:compute',
} as const

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel]

// ---------------------------------------------------------------------------
// Eventos (Main -> Renderer, push via webContents.send)
// ---------------------------------------------------------------------------

export const IpcEvent = {
  /** Stream de entradas do Request Log emitido pelo RequestQueueManager. */
  LogEntry: 'event:log-entry',
  /** Atualização agregada do estado da fila. */
  QueueStatus: 'event:queue-status',
  /** Progresso por-card do ciclo unificado da Watchlist (Bug #2b). */
  WatchlistCard: 'event:watchlist-card',
  /** Alerta da "Minha Loja" (Venda/DC) para toast in-app quando o app está em foco. */
  StoreAlert: 'event:store-alert',
} as const

export type IpcEvent = (typeof IpcEvent)[keyof typeof IpcEvent]

// ---------------------------------------------------------------------------
// DTOs específicos do transporte IPC
// ---------------------------------------------------------------------------

export interface AppInfo {
  name: string
  version: string
  electron: string
  chrome: string
  node: string
  platform: NodeJS.Platform
}

export interface SearchQuery {
  searchWord: string
  serverType: ServerType
  storeType: StoreType
}

/** Resultado agrupado por `itemId` exibido na lista de sugestões. */
export interface SearchResultGroup {
  itemId: number
  itemName: string
  databaseImgPath: string
  databaseType: string
  /** `false` quando o item só foi encontrado no histórico (sem lojas ativas). */
  hasActiveStores: boolean
  storeCount: number
}

/** Visão composta da Tela de Detalhes do Item. */
export interface ItemDetails {
  item: Item
  listings: ActiveStoreListing[]
  analysis: MarketAnalysis | null
  /** Última sincronização da fonte de dados exibida. */
  updatedAt: string
}

export interface ExpandStoreRequest {
  svrId: number
  mapId: number
  ssi: string
}

/** Estado de um card no ciclo de polling (visão "Na Fila" / "Atualizando"). */
export type WatchlistCardState = 'queued' | 'updating' | 'idle'

/** Payload do evento push emitido a cada transição de estado de um card. */
export interface WatchlistCardUpdate {
  itemId: number
  state: WatchlistCardState
  /** Presente apenas quando `state` é `'idle'` após uma sincronização bem-sucedida. */
  details: ItemDetails | null
}

/** Alerta da "Minha Loja" exibido como toast in-app (Venda/DC) quando em foco. */
export interface StoreAlert {
  title: string
  body: string
}

export interface CreateProfileRequest {
  name: string
  characterName?: string | null
}

export interface UpdateProfileRequest {
  id: number
  name?: string
  characterName?: string | null
}

// ---------------------------------------------------------------------------
// Mapa do contrato: canal -> { request; response }
// ---------------------------------------------------------------------------

export interface IpcContract {
  [IpcChannel.SystemPing]: { request: void; response: 'pong' }
  [IpcChannel.SystemGetAppInfo]: { request: void; response: AppInfo }

  [IpcChannel.DialogPickSave]: {
    request: { defaultName?: string }
    response: { filePath: string | null }
  }
  [IpcChannel.DialogPickOpen]: { request: void; response: { filePath: string | null } }

  [IpcChannel.SearchItems]: { request: SearchQuery; response: SearchResultGroup[] }

  [IpcChannel.ItemGetDetails]: {
    request: { itemId: number; serverType: ServerType }
    response: ItemDetails
  }
  [IpcChannel.ItemSync]: {
    request: { itemId: number; serverType: ServerType }
    response: ItemDetails
  }
  [IpcChannel.ItemExpandStore]: { request: ExpandStoreRequest; response: StoreLocation }
  [IpcChannel.ItemExpandDetail]: { request: ExpandStoreRequest; response: StoreItemDetail }

  [IpcChannel.WatchlistList]: { request: void; response: WatchlistEntry[] }
  [IpcChannel.WatchlistAdd]: { request: { itemId: number }; response: WatchlistEntry }
  [IpcChannel.WatchlistRemove]: { request: { itemId: number }; response: void }
  [IpcChannel.WatchlistSetMonitoring]: {
    request: { itemId: number; enabled: boolean }
    response: void
  }
  [IpcChannel.WatchlistSetInMyStore]: {
    request: { itemId: number; enabled: boolean }
    response: void
  }
  [IpcChannel.WatchlistBulkImport]: {
    request: { content: string }
    response: { queued: number }
  }
  [IpcChannel.WatchlistSetMonitoringMaster]: { request: { enabled: boolean }; response: void }
  [IpcChannel.WatchlistGetMonitoringMaster]: { request: void; response: { enabled: boolean } }

  [IpcChannel.ProfileList]: { request: void; response: Profile[] }
  [IpcChannel.ProfileGetActive]: { request: void; response: Profile | null }
  [IpcChannel.ProfileSetActive]: { request: { profileId: number }; response: void }
  [IpcChannel.ProfileCreate]: { request: CreateProfileRequest; response: Profile }
  [IpcChannel.ProfileUpdate]: { request: UpdateProfileRequest; response: Profile }
  [IpcChannel.ProfileDelete]: { request: { id: number }; response: void }
  [IpcChannel.ProfileExport]: {
    request: { profileId: number; filePath: string }
    response: { filePath: string }
  }
  [IpcChannel.ProfileImport]: { request: { filePath: string }; response: Profile }

  [IpcChannel.MetricsCompute]: { request: { itemId: number }; response: MarketAnalysis }
}

/** Tipo da requisição de um canal. */
export type IpcRequest<C extends IpcChannel> = IpcContract[C]['request']
/** Tipo da resposta de um canal. */
export type IpcResponse<C extends IpcChannel> = IpcContract[C]['response']

/** Payloads dos eventos push (Main -> Renderer). */
export interface IpcEventPayload {
  [IpcEvent.LogEntry]: RequestLogEntry
  [IpcEvent.QueueStatus]: QueueStatus
  [IpcEvent.WatchlistCard]: WatchlistCardUpdate
  [IpcEvent.StoreAlert]: StoreAlert
}

// ---------------------------------------------------------------------------
// Superfície exposta pelo preload em `window.api`
// ---------------------------------------------------------------------------

/** Helper: argumentos de `invoke` — omite o payload quando o request é `void`. */
export type InvokeArgs<C extends IpcChannel> =
  IpcRequest<C> extends void ? [] : [request: IpcRequest<C>]

export interface OlhoDeOdinApi {
  /** Invoca um canal tipado e resolve com a resposta tipada. */
  invoke<C extends IpcChannel>(channel: C, ...args: InvokeArgs<C>): Promise<IpcResponse<C>>

  /** Inscreve-se em um evento push do Main. Retorna a função de cancelamento. */
  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventPayload[E]) => void): () => void

  /** Atalhos de diagnóstico do sistema. */
  system: {
    ping(): Promise<'pong'>
    getAppInfo(): Promise<AppInfo>
  }
}
