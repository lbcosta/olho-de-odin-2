// src/main/ipc/registerHandlers.ts
// Registro central dos handlers IPC, todos tipados pelo contrato em @shared/types/ipc.
// Fase 1: sistema/diagnóstico. Fase 2: Perfil (ProfileService).
// Fase 3 plugará Search/Item/Watchlist/Metrics consumindo o GnJoy Client.

import { app } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/types/ipc'
import { getDatabase } from '../database'
import { ProfileService } from '../services/profile/ProfileService'
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

function registerProfileHandlers(): void {
  const profiles = new ProfileService(getDatabase())

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

/** Registra todos os handlers IPC disponíveis. Chamado uma vez no boot. */
export function registerIpcHandlers(): void {
  registerSystemHandlers()
  registerProfileHandlers()

  // TODO(Fase 3): SearchItems, Item*, Watchlist*, MetricsCompute (consumo do GnJoy Client).
}
