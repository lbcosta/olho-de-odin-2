// src/main/ipc/broadcast.ts
// Encaminha um evento push (Main -> Renderer) a todas as janelas/renderers vivos.

import { webContents } from 'electron'
import type { IpcEvent, IpcEventPayload } from '@shared/types/ipc'

export function broadcast<E extends IpcEvent>(event: E, payload: IpcEventPayload[E]): void {
  for (const contents of webContents.getAllWebContents()) {
    if (!contents.isDestroyed()) contents.send(event, payload)
  }
}
