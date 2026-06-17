// src/main/ipc/registerHandlers.ts
// Registro central dos handlers IPC, todos tipados pelo contrato @shared/types/ipc.
// Fase 1: sistema. Fase 2: Perfil. Fase 3: Search/Item/Watchlist/Metrics (GnJoy).

import { app } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/types/ipc'
import { getDatabase } from '../database'
import { ProfileService } from '../services/profile/ProfileService'
import { CacheService } from '../services/cache/CacheService'
import { GnJoyClient } from '../services/gnjoy/GnJoyClient'
import { RequestQueueManager } from '../services/gnjoy/RequestQueueManager'
import { MarketService } from '../services/market/MarketService'
import { handle } from './handle'

function buildAppInfo(): AppInfo {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
  }
}

function registerSystemHandlers(): void {
  handle(IpcChannel.SystemPing, () => 'pong')
  handle(IpcChannel.SystemGetAppInfo, () => buildAppInfo())
}

function registerProfileHandlers(profiles: ProfileService): void {
  handle(IpcChannel.ProfileList, () => profiles.list())
  handle(IpcChannel.ProfileGetActive, () => profiles.getActive())
  handle(IpcChannel.ProfileSetActive, ({ profileId }) => {
    profiles.setActive(profileId)
  })
  handle(IpcChannel.ProfileCreate, (request) => profiles.create(request))
  handle(IpcChannel.ProfileUpdate, (request) => profiles.update(request))
  handle(IpcChannel.ProfileDelete, ({ id }) => {
    profiles.delete(id)
  })
  handle(IpcChannel.ProfileExport, ({ profileId, filePath }) => ({
    filePath: profiles.exportToFile(profileId, filePath),
  }))
  handle(IpcChannel.ProfileImport, ({ filePath }) => profiles.importFromFile(filePath))
}

function registerMarketHandlers(market: MarketService): void {
  handle(IpcChannel.SearchItems, (query) => market.searchItems(query))
  handle(IpcChannel.ItemGetDetails, ({ itemId }) => market.getItemDetails(itemId))
  handle(IpcChannel.ItemSync, ({ itemId, serverType }) => market.syncItem(itemId, serverType))
  handle(IpcChannel.ItemExpandStore, (request) => market.expandStore(request))

  handle(IpcChannel.WatchlistList, () => market.listWatchlist())
  handle(IpcChannel.WatchlistAdd, ({ itemId }) => market.addToWatchlist(itemId))
  handle(IpcChannel.WatchlistRemove, ({ itemId }) => {
    market.removeFromWatchlist(itemId)
  })
  handle(IpcChannel.WatchlistSetMonitoring, ({ itemId, enabled }) => {
    market.setMonitoring(itemId, enabled)
  })
  handle(IpcChannel.WatchlistSetInMyStore, ({ itemId, enabled }) => {
    market.setInMyStore(itemId, enabled)
  })
  handle(IpcChannel.WatchlistBulkImport, ({ filePath }) => market.bulkImport(filePath))

  handle(IpcChannel.MetricsCompute, ({ itemId }) => market.computeMetrics(itemId))
}

/** Registra todos os handlers IPC disponíveis. Chamado uma vez no boot. */
export function registerIpcHandlers(): void {
  const db = getDatabase()
  const profiles = new ProfileService(db)
  const cache = new CacheService(db)
  const queue = RequestQueueManager.getInstance()
  const client = new GnJoyClient(queue)
  const market = new MarketService(queue, client, cache, profiles)

  registerSystemHandlers()
  registerProfileHandlers(profiles)
  registerMarketHandlers(market)
}
