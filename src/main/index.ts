// src/main/index.ts
// Entry point do Main Process: ciclo de vida, banco, fila global e IPC.

import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { initDatabase, getDatabase, closeDatabase, DB_FILENAME } from './database'
import { applySchema } from './database/migrate'
import { registerIpcHandlers, type RegisteredServices } from './ipc/registerHandlers'
import { RequestQueueManager } from './services/gnjoy/RequestQueueManager'
import { createMainWindow } from './window'
import { createTray } from './tray'
import { broadcast } from './ipc/broadcast'
import { IpcEvent } from '@shared/types/ipc'

let mainWindow: BrowserWindow | null = null
let services: RegisteredServices | null = null

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

  services = registerIpcHandlers()
  bridgeQueueTelemetry()

  mainWindow = createMainWindow()
  createTray(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow()
  })
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  services?.watchlistMonitor.setEnabled(false)
  closeDatabase()
})
