// src/main/index.ts
// Entry point do Main Process: ciclo de vida do app, banco e IPC.

import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { initDatabase, closeDatabase, DB_FILENAME } from './database'
import { registerIpcHandlers } from './ipc/registerHandlers'
import { createMainWindow } from './window'

function bootstrap(): void {
  // Banco local unificado em userData (persistente entre execuções).
  initDatabase(join(app.getPath('userData'), DB_FILENAME))

  // Handlers IPC disponíveis antes de qualquer janela renderizar.
  registerIpcHandlers()

  createMainWindow()

  app.on('activate', () => {
    // macOS: recria a janela ao clicar no dock se nenhuma estiver aberta.
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
}

app.whenReady().then(bootstrap)

app.on('window-all-closed', () => {
  // Encerra em Windows/Linux; no macOS o app permanece ativo.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  closeDatabase()
})
