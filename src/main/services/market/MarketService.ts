// src/main/services/market/MarketService.ts
// Orquestra busca, item, lojas, métricas e watchlist combinando GnJoyClient
// (rede), CacheService (Local-First), ProfileService (persistência) e
// SalesMetrics (matemática). É a fonte dos handlers IPC de Fase 3.

import type {
  ActiveStoreListing,
  MarketAnalysis,
  PriceHistory,
  RequestPriority,
  ServerType,
  StoreLocation,
  StoreType,
  WatchlistEntry,
} from '@shared/types/domain'
import type {
  ExpandStoreRequest,
  ItemDetails,
  SearchQuery,
  SearchResultGroup,
} from '@shared/types/ipc'
import type { RequestQueueManager } from '../gnjoy/RequestQueueManager'
import { GnJoyClient, GnJoyError } from '../gnjoy/GnJoyClient'
import {
  priceHistoryEndpoint,
  searchActiveEndpoint,
  searchHistoryEndpoint,
  storeLocationEndpoint,
} from '../gnjoy/endpoints'
import {
  parseActiveListings,
  parseHistoricalSummaries,
  parsePriceHistory,
  parseStoreLocation,
} from '../gnjoy/parser'
import { analyzeMarket } from '../metrics/SalesMetrics'
import { MARKET_STORE_TYPE } from '@shared/marketScope'
import type { CacheService } from '../cache/CacheService'
import type { ProfileService } from '../profile/ProfileService'
import { BulkImportService } from '../search/BulkImport'

interface ItemCacheEntry {
  listings: ActiveStoreListing[]
  history: PriceHistory | null
}

const itemKey = (itemId: number): string => `item:${itemId}`
const storeKey = (ssi: string): string => `store:${ssi}`

export class MarketService {
  constructor(
    private readonly queue: RequestQueueManager,
    private readonly client: GnJoyClient,
    private readonly cache: CacheService,
    private readonly profiles: ProfileService,
  ) {}

  // ----- Busca ------------------------------------------------------------

  async searchItems(
    query: SearchQuery,
    priority: RequestPriority = 'HIGH',
  ): Promise<SearchResultGroup[]> {
    const raw = await this.client.get(searchActiveEndpoint(query), priority)
    const listings = parseActiveListings(raw)

    if (listings.length > 0) {
      const groups: SearchResultGroup[] = []
      for (const [itemId, items] of this.groupByItem(listings)) {
        const first = items[0]
        this.registerAndCache(itemId, items)
        groups.push({
          itemId,
          itemName: first.itemName,
          databaseImgPath: first.databaseImgPath,
          databaseType: first.databaseType,
          hasActiveStores: true,
          storeCount: items.length,
        })
      }
      return groups
    }

    // Fallback: histórico (item sem lojas ativas no momento).
    const histRaw = await this.client.get(
      searchHistoryEndpoint({ searchWord: query.searchWord, serverType: query.serverType }),
      priority,
    )
    return parseHistoricalSummaries(histRaw).map((s) => {
      this.profiles.registerItem({
        itemId: s.itemId,
        name: s.itemName,
        type: s.databaseType,
        imgPath: s.databaseImgPath,
      })
      return {
        itemId: s.itemId,
        itemName: s.itemName,
        databaseImgPath: s.databaseImgPath,
        databaseType: s.databaseType,
        hasActiveStores: false,
        storeCount: 0,
      }
    })
  }

  // ----- Item -------------------------------------------------------------

  /** Detalhes do item a partir do cache local (Local-First, instantâneo). */
  getItemDetails(itemId: number): ItemDetails {
    const item = this.profiles.getItem(itemId)
    if (!item) throw new Error(`Item ${itemId} não cadastrado.`)
    const cached = this.cache.get<ItemCacheEntry>(itemKey(itemId))
    const listings = cached?.value.listings ?? []
    const days = cached?.value.history?.priceDetailDayList ?? []
    return {
      item,
      listings,
      analysis: listings.length > 0 ? analyzeMarket(listings, days) : null,
      updatedAt: cached?.updatedAt ?? item.updatedAt,
    }
  }

  /** Sincroniza o item via rede (lojas ativas + histórico) e atualiza o cache. */
  async syncItem(
    itemId: number,
    serverType: ServerType,
    storeType: StoreType = MARKET_STORE_TYPE,
  ): Promise<ItemDetails> {
    const item = this.profiles.getItem(itemId)
    if (!item) throw new Error(`Item ${itemId} não cadastrado.`)

    const raw = await this.client.get(
      searchActiveEndpoint({ searchWord: item.name, serverType, storeType }),
      'HIGH',
    )
    const listings = parseActiveListings(raw).filter((l) => l.itemId === itemId)

    let history: PriceHistory | null = null
    const svrId = listings[0]?.svrId
    if (svrId !== undefined) {
      // O histórico detalhado é uma Server Action da página `market-price`.
      // É preciso visitar (GET) essa MESMA página antes do POST para capturar o
      // hash Next-Action correto: o hash da busca em `trading` não é válido para
      // a ação de preço e ainda condenaria o auto-renew a reabrir a página
      // errada (causa do "Falha ao renovar a sessão Next-Action").
      await this.client.get(searchHistoryEndpoint({ searchWord: item.name, serverType }), 'HIGH')
      const priceRaw = await this.client.post(priceHistoryEndpoint({ itemId, svrId }), 'HIGH')
      history = parsePriceHistory(priceRaw)
    }

    this.cache.set(itemKey(itemId), { listings, history })
    this.profiles.touchItem(itemId)
    return this.getItemDetails(itemId)
  }

  /** Localização da loja (Lazy Load), com cache por ssi para o comando /navi. */
  async expandStore(req: ExpandStoreRequest): Promise<StoreLocation> {
    const cached = this.cache.get<StoreLocation>(storeKey(req.ssi))
    if (cached) return cached.value

    const raw = await this.client.post(storeLocationEndpoint(req), 'HIGH')
    const loc = parseStoreLocation(raw)
    if (!loc) throw new GnJoyError('Localização da loja não encontrada.')

    this.cache.set(storeKey(req.ssi), loc)
    this.cache.setStoreLocation(loc)
    return loc
  }

  /**
   * Atualiza apenas as lojas ativas do item (busca, sem histórico) com
   * Prioridade Máxima — usado pelo Tracker "Minha Loja".
   */
  async refreshListings(
    itemId: number,
    serverType: ServerType,
    storeType: StoreType = MARKET_STORE_TYPE,
  ): Promise<ActiveStoreListing[]> {
    const item = this.profiles.getItem(itemId)
    if (!item) return []
    const raw = await this.client.get(
      searchActiveEndpoint({ searchWord: item.name, serverType, storeType }),
      'HIGH',
    )
    const listings = parseActiveListings(raw).filter((l) => l.itemId === itemId)
    const previous = this.cache.get<ItemCacheEntry>(itemKey(itemId))
    this.cache.set(itemKey(itemId), { listings, history: previous?.value.history ?? null })
    this.profiles.touchItem(itemId)
    return listings
  }

  computeMetrics(itemId: number): MarketAnalysis {
    const cached = this.cache.get<ItemCacheEntry>(itemKey(itemId))
    return analyzeMarket(
      cached?.value.listings ?? [],
      cached?.value.history?.priceDetailDayList ?? [],
    )
  }

  // ----- Watchlist (perfil ativo) ----------------------------------------

  listWatchlist(): WatchlistEntry[] {
    return this.profiles.listWatchlist(this.activeProfileId())
  }

  addToWatchlist(itemId: number): WatchlistEntry {
    const item = this.profiles.getItem(itemId)
    if (!item) throw new Error(`Item ${itemId} não cadastrado.`)
    return this.profiles.addToWatchlist(this.activeProfileId(), {
      itemId,
      name: item.name,
      type: item.type,
      imgPath: item.imgPath,
    })
  }

  removeFromWatchlist(itemId: number): void {
    this.profiles.removeFromWatchlist(this.activeProfileId(), itemId)
  }

  setMonitoring(itemId: number, enabled: boolean): void {
    this.profiles.setMonitoring(this.activeProfileId(), itemId, enabled)
  }

  setInMyStore(itemId: number, enabled: boolean): void {
    this.profiles.setInMyStore(this.activeProfileId(), itemId, enabled)
  }

  bulkImport(filePath: string): { queued: number } {
    const importer = new BulkImportService(this.queue, async (name) => {
      const groups = await this.searchItems(
        { searchWord: name, serverType: 'NIDHOGG', storeType: MARKET_STORE_TYPE },
        'LOW',
      )
      if (groups[0]) this.addToWatchlist(groups[0].itemId)
    })
    return { queued: importer.importFromFile(filePath).queued }
  }

  // ----- Internos ---------------------------------------------------------

  private activeProfileId(): number {
    const profile = this.profiles.getActive() ?? this.profiles.create({ name: 'Padrão' })
    return profile.id
  }

  private registerAndCache(itemId: number, items: ActiveStoreListing[]): void {
    const first = items[0]
    this.profiles.registerItem({
      itemId,
      name: first.itemName,
      type: first.databaseType,
      imgPath: first.databaseImgPath,
    })
    const previous = this.cache.get<ItemCacheEntry>(itemKey(itemId))
    this.cache.set(itemKey(itemId), { listings: items, history: previous?.value.history ?? null })
  }

  private groupByItem(listings: ActiveStoreListing[]): Map<number, ActiveStoreListing[]> {
    const map = new Map<number, ActiveStoreListing[]>()
    for (const listing of listings) {
      const arr = map.get(listing.itemId)
      if (arr) arr.push(listing)
      else map.set(listing.itemId, [listing])
    }
    return map
  }
}
