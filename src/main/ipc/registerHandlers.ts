// src/main/ipc/registerHandlers.ts
// Ponto central de registro dos handlers IPC.
// Fase 1: apenas os canais de sistema/diagnóstico estão implementados.
// As fases seguintes (Profile, Search, Item, Watchlist, Metrics) plugam seus
// handlers aqui — todos já tipados pelo contrato em `@shared/types/ipc`.

import { app } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/types/ipc'
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

/** Registra todos os handlers IPC disponíveis. Chamado uma vez no boot. */
export function registerIpcHandlers(): void {
  handle(IpcChannel.SystemPing, () => 'pong')
  handle(IpcChannel.SystemGetAppInfo, () => buildAppInfo())

  // TODO(Fase 2): Profile* e MetricsCompute
  // TODO(Fase 3): SearchItems, Item*, Watchlist*
}
