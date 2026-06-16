// src/preload/index.ts
// Ponte segura (contextBridge) que expõe `window.api` ao renderer.
// Implementa o contrato `OlhoDeOdinApi` derivado de `@shared/types/ipc`.

import { contextBridge, ipcRenderer } from 'electron'
import {
  IpcChannel,
  IpcEvent,
  type AppInfo,
  type InvokeArgs,
  type IpcEventPayload,
  type IpcResponse,
  type OlhoDeOdinApi,
} from '@shared/types/ipc'

const api: OlhoDeOdinApi = {
  invoke<C extends IpcChannel>(channel: C, ...args: InvokeArgs<C>): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcResponse<C>>
  },

  on<E extends IpcEvent>(event: E, listener: (payload: IpcEventPayload[E]) => void): () => void {
    const channelListener = (_event: Electron.IpcRendererEvent, payload: IpcEventPayload[E]) =>
      listener(payload)
    ipcRenderer.on(event, channelListener)
    return () => {
      ipcRenderer.removeListener(event, channelListener)
    }
  },

  system: {
    ping: () => ipcRenderer.invoke(IpcChannel.SystemPing) as Promise<'pong'>,
    getAppInfo: () => ipcRenderer.invoke(IpcChannel.SystemGetAppInfo) as Promise<AppInfo>,
  },
}

contextBridge.exposeInMainWorld('api', api)
