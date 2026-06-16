// src/main/ipc/handle.ts
// Wrapper tipado sobre `ipcMain.handle` que força a aderência ao contrato IPC.
// O `request` e o retorno do handler são checados em tempo de compilação
// contra `IpcContract`, eliminando divergências de payload entre as camadas.

import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { IpcChannel, IpcRequest, IpcResponse } from '@shared/types/ipc'

export type IpcHandler<C extends IpcChannel> = (
  request: IpcRequest<C>,
  event: IpcMainInvokeEvent,
) => Promise<IpcResponse<C>> | IpcResponse<C>

/** Registra um handler tipado para um canal do contrato. */
export function handle<C extends IpcChannel>(channel: C, handler: IpcHandler<C>): void {
  ipcMain.handle(channel, (event, request) => handler(request as IpcRequest<C>, event))
}
