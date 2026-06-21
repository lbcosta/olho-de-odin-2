// src/renderer/hooks/useStoreAlerts.ts
// Exibe os alertas da "Minha Loja" (Venda/DC) como toast quando o app está em
// foco — o Main só emite `event:store-alert` nesse caso (caso contrário usa a
// notificação nativa do SO).

import { useEffect } from 'react'
import { IpcEvent } from '@shared/types/ipc'
import { getApi } from './useApi'
import { useToast } from '../contexts/ToastContext'

export function useStoreAlerts(): void {
  const { addToast } = useToast()
  useEffect(() => {
    const api = getApi()
    if (!api) return
    return api.on(IpcEvent.StoreAlert, (alert) => {
      addToast(`${alert.title} — ${alert.body}`, 'info')
    })
  }, [addToast])
}
