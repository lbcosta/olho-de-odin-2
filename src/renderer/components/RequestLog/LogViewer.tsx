// src/renderer/components/RequestLog/LogViewer.tsx
// Barra de Log global (T015): rodapé persistente atrelado ao RequestQueueManager.
//  - Colapsada: ação humanizada + nº de pendentes + spinner.
//  - Expandida: console color-coded por status — cada linha mostra a AÇÃO
//    amigável (verde=ok, amarelo=em andamento, vermelho=erro, cinza=na fila),
//    com o path técnico como subtexto. slice(-50) (anti memory leak).

import { useState } from 'react'
import type { LogColorToken } from '@shared/log'
import { resolveLogColor } from '@shared/log'
import type { RequestLogEntry } from '@shared/types/domain'
import { useRequestLog } from '../../hooks/useRequestLog'
import { useDocumentVisible } from '../../hooks/useDocumentVisible'
import { translateLogPath } from '../../utils/LogTranslator'

/** Classe de cor do texto por token semântico (alinhada aos dots do log). */
const LOG_TEXT_CLASS: Record<LogColorToken, string> = {
  success: 'text-log-success',
  error: 'text-log-error',
  progress: 'text-log-progress',
  pending: 'text-gray-400',
}

/** Rótulo curto do status (lado direito da linha). */
function statusLabel(entry: RequestLogEntry): string {
  switch (entry.status) {
    case 'SUCCESS':
      return entry.httpStatus ? `OK ${entry.httpStatus}` : 'OK'
    case 'ERROR':
      return entry.httpStatus ? `ERRO ${entry.httpStatus}` : 'ERRO'
    case 'IN_PROGRESS':
      return 'em andamento'
    case 'PENDING':
      return 'na fila'
  }
}

/** Ação amigável da entrada (cai no tradutor de path quando não há rótulo). */
function actionLabel(entry: RequestLogEntry): string {
  return entry.humanAction || translateLogPath(entry.path)
}

export function LogViewer(): React.JSX.Element {
  const { entries, status } = useRequestLog()
  const [expanded, setExpanded] = useState(false)
  const visible = useDocumentVisible()
  // Minimizado => suspende a animação do spinner (preserva GPU — F5).
  const showSpinner = status.isProcessing && visible

  const latest = entries[entries.length - 1]
  const collapsedLabel = status.currentAction ?? (latest ? actionLabel(latest) : 'Ocioso')

  return (
    <footer className="border-t border-surface-border bg-surface-raised text-xs">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-surface-overlay"
      >
        {showSpinner ? (
          <span
            aria-label="Processando"
            className="h-3 w-3 animate-spin rounded-full border-2 border-odin-400 border-t-transparent"
          />
        ) : (
          <span className="oo-log-dot oo-log-dot--pending" aria-hidden="true" />
        )}
        <span className="flex-1 truncate text-gray-300">{collapsedLabel}</span>
        {status.pending > 0 && <span className="text-gray-400">{status.pending} pendente(s)</span>}
        <span className="text-gray-500">{expanded ? '▾' : '▴'}</span>
      </button>

      {expanded && (
        <ul className="max-h-56 overflow-y-auto border-t border-surface-border font-mono">
          {entries.length === 0 && (
            <li className="px-4 py-3 text-gray-500">Sem requisições registradas.</li>
          )}
          {[...entries].reverse().map((entry) => {
            const color = resolveLogColor(entry.status)
            const textClass = LOG_TEXT_CLASS[color]
            return (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-1.5 odd:bg-surface/40">
                <span className={`oo-log-dot oo-log-dot--${color}`} aria-hidden="true" />
                <span className="w-10 shrink-0 text-gray-500">{entry.method}</span>
                <span className="flex-1 truncate">
                  <span className={textClass}>{actionLabel(entry)}</span>
                  <span className="ml-2 text-gray-600">· {entry.path}</span>
                </span>
                <span className={`shrink-0 ${textClass}`}>{statusLabel(entry)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </footer>
  )
}
