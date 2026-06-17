// src/main/index.ts
// Entry point do Main Process: ciclo de vida, banco, fila global e IPC.

import { join } from 'node:path'
import { app, BrowserWindow, webContents } from 'electron'
import { initDatabase, getDatabase, closeDatabase, DB_FILENAME } from './database'
import { applySchema } from './database/migrate'
import { registerIpcHandlers } from './ipc/registerHandlers'
import { RequestQueueManager } from './services/gnjoy/RequestQueueManager'
import { createMainWindow } from './window'
import { createTray } from './tray'
import { StoreTracker } from './services/store/StoreTracker'
import { sendOsNotification } from './notifications'
import { IpcEvent } from '@shared/types/ipc'

let mainWindow: BrowserWindow | null = null
let storeTracker: StoreTracker | null = null

/** Encaminha um evento a todas as janelas/renderers vivos. */
function broadcast(channel: string, payload: unknown): void {
  for (const contents of webContents.getAllWebContents()) {
    if (!contents.isDestroyed()) contents.send(channel, payload)
  }
}

/** Liga a telemetria da fila global ao Request Log do renderer. */
function bridgeQueueTelemetry(): void {
  const queue = RequestQueueManager.getInstance()
  queue.on('log', (entry) => broadcast(IpcEvent.LogEntry, entry))
  queue.on('queue', (status) => broadcast(IpcEvent.QueueStatus, status))
}

function bootstrap(): void {
  // Banco local unificado + esquema (idempotente) antes de qualquer IPC.
  initDatabase(join(app.getPath('userData'), DB_FILENAME))
  applySchema(getDatabase())

  const services = registerIpcHandlers()
  bridgeQueueTelemetry()

  mainWindow = createMainWindow()
  createTray(() => mainWindow)

  // Tracker "Minha Loja": ciclo de fundo (Prioridade Máxima via fila).
  // Auto-skip enquanto não houver Char + itens isInMyStore (nenhuma chamada de rede).
  storeTracker = new StoreTracker(
    services.profiles,
    (itemId) => services.market.refreshListings(itemId, 'NIDHOGG'),
    sendOsNotification,
  )
  storeTracker.start()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow()
  })
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  storeTracker?.stop()
  closeDatabase()
})
