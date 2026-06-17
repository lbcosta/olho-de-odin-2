// src/renderer/components/RequestLog/LogViewer.tsx
// Barra de Log global (T015): rodapé persistente atrelado ao RequestQueueManager.
//  - Colapsada: ação humanizada + nº de pendentes + spinner.
//  - Expandida: console (METHOD, PATH, STATUS) com cores semânticas, slice(-50).

import { useState } from 'react'
import { resolveLogColor } from '@shared/log'
import { useRequestLog } from '../../hooks/useRequestLog'
import { translateLogPath } from '../../utils/LogTranslator'

export function LogViewer(): React.JSX.Element {
  const { entries, status } = useRequestLog()
  const [expanded, setExpanded] = useState(false)

  const latest = entries[entries.length - 1]
  const collapsedLabel = status.currentAction ?? (latest ? translateLogPath(latest.path) : 'Ocioso')

  return (
    <footer className="border-t border-surface-border bg-surface-raised text-xs">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-surface-overlay"
      >
        {status.isProcessing ? (
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
          {[...entries].reverse().map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-4 py-1.5 odd:bg-surface/40">
              <span
                className={`oo-log-dot oo-log-dot--${resolveLogColor(entry.status)}`}
                aria-hidden="true"
              />
              <span className="w-10 shrink-0 text-gray-400">{entry.method}</span>
              <span className="flex-1 truncate text-gray-300">{entry.path}</span>
              <span className="shrink-0 text-gray-500">{entry.httpStatus ?? entry.status}</span>
            </li>
          ))}
        </ul>
      )}
    </footer>
  )
}
