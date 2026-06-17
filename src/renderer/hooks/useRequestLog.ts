// src/renderer/hooks/useRequestLog.ts
// Assina os eventos do RequestQueueManager (via IPC) e mantém o histórico
// limitado a LOG_HISTORY_LIMIT (slice(-50)) — proteção contra Memory Leak.

import { useEffect, useState } from 'react'
import { IpcEvent } from '@shared/types/ipc'
import type { QueueStatus, RequestLogEntry } from '@shared/types/domain'
import { LOG_HISTORY_LIMIT } from '@shared/log'
import { getApi } from './useApi'

const IDLE: QueueStatus = { pending: 0, isProcessing: false, currentAction: null }

export function useRequestLog(): { entries: RequestLogEntry[]; status: QueueStatus } {
  const [entries, setEntries] = useState<RequestLogEntry[]>([])
  const [status, setStatus] = useState<QueueStatus>(IDLE)

  useEffect(() => {
    const api = getApi()
    if (!api) return

    const offLog = api.on(IpcEvent.LogEntry, (entry) => {
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === entry.id)
        const next = index >= 0 ? prev.map((e, i) => (i === index ? entry : e)) : [...prev, entry]
        return next.slice(-LOG_HISTORY_LIMIT)
      })
    })
    const offQueue = api.on(IpcEvent.QueueStatus, setStatus)

    return () => {
      offLog()
      offQueue()
    }
  }, [])

  return { entries, status }
}
