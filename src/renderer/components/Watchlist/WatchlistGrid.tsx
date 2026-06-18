// src/renderer/components/Watchlist/WatchlistGrid.tsx
// Dashboard da Watchlist (T020): grid de cards consumindo o IPC de forma
// assíncrona. O Master Switch liga o ciclo de polling; cada card reflete seu
// estado na fila (Na Fila / Atualizando), respeitando o Rate Limit (3s/req).

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WatchlistEntry } from '@shared/types/domain'
import type { ItemDetails } from '@shared/types/ipc'
import { getApi } from '../../hooks/useApi'
import { useNavigation } from '../../contexts/NavigationContext'
import { useToast } from '../../contexts/ToastContext'
import { SkeletonCard } from '../ui/Skeleton'
import {
  STATUS_DISPLAY,
  STRATEGY_DISPLAY,
  formatTimestamp,
  formatZeny,
} from '../../utils/marketDisplay'
import { MIN_ITEM_SPACING_MS, watchlistSpacingMs } from '../../utils/watchlistCycle'

type CardState = 'idle' | 'queued' | 'updating'
interface Card {
  entry: WatchlistEntry
  details: ItemDetails | null
  state: CardState
}

/** Espera `ms` em passos curtos, interrompível quando o monitoramento desliga. */
async function interruptibleWait(ms: number, isRunning: () => boolean): Promise<void> {
  const STEP_MS = 500
  for (let elapsed = 0; elapsed < ms && isRunning(); elapsed += STEP_MS) {
    await new Promise((resolve) => setTimeout(resolve, STEP_MS))
  }
}

export function WatchlistGrid(): React.JSX.Element {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [masterOn, setMasterOn] = useState(false)
  const monitoredIdsRef = useRef<number[]>([])
  const runningRef = useRef(false)
  const { navigate } = useNavigation()
  const { addToast } = useToast()

  // Apenas itens com monitoramento ativo entram no ciclo (pausados são pulados).
  useEffect(() => {
    monitoredIdsRef.current = cards.filter((c) => c.entry.isMonitoring).map((c) => c.entry.itemId)
  }, [cards])

  const loadWatchlist = useCallback(async () => {
    const api = getApi()
    if (!api) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const entries = await api.invoke('watchlist:list')
      const loaded = await Promise.all(
        entries.map(async (entry) => ({
          entry,
          state: 'idle' as CardState,
          details: await api
            .invoke('item:get-details', { itemId: entry.itemId, serverType: 'NIDHOGG' })
            .catch(() => null),
        })),
      )
      setCards(loaded)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadWatchlist()
  }, [loadWatchlist])

  const runMonitorLoop = useCallback(async () => {
    const api = getApi()
    if (!api) return
    const isRunning = () => runningRef.current

    while (isRunning()) {
      const ids = monitoredIdsRef.current
      if (ids.length === 0) {
        await interruptibleWait(MIN_ITEM_SPACING_MS, isRunning)
        continue
      }
      // Espaçamento dinâmico do ciclo: S = max(3s, T/N). Evita re-buscar o
      // mesmo item em rajada (bug "metralhadora").
      const spacing = watchlistSpacingMs(ids.length)
      setCards((prev) =>
        prev.map((c) => (ids.includes(c.entry.itemId) ? { ...c, state: 'queued' } : c)),
      )
      for (const itemId of ids) {
        if (!isRunning()) break
        setCards((prev) =>
          prev.map((c) => (c.entry.itemId === itemId ? { ...c, state: 'updating' } : c)),
        )
        try {
          const details = await api.invoke('item:sync', { itemId, serverType: 'NIDHOGG' })
          setCards((prev) =>
            prev.map((c) => (c.entry.itemId === itemId ? { ...c, details, state: 'idle' } : c)),
          )
        } catch {
          setCards((prev) =>
            prev.map((c) => (c.entry.itemId === itemId ? { ...c, state: 'idle' } : c)),
          )
        }
        if (!isRunning()) break
        await interruptibleWait(spacing, isRunning)
      }
    }
  }, [])

  // Master Switch: liga/desliga o ciclo de monitoramento espaçado.
  useEffect(() => {
    if (!masterOn) {
      runningRef.current = false
      return
    }
    runningRef.current = true
    void runMonitorLoop()
    return () => {
      runningRef.current = false
    }
  }, [masterOn, runMonitorLoop])

  async function remove(itemId: number): Promise<void> {
    const api = getApi()
    if (!api) return
    await api.invoke('watchlist:remove', { itemId })
    setCards((prev) => prev.filter((c) => c.entry.itemId !== itemId))
    addToast('Item removido da Watchlist.', 'info')
  }

  async function toggleMonitoring(entry: WatchlistEntry): Promise<void> {
    const api = getApi()
    if (!api) return
    const enabled = !entry.isMonitoring
    await api.invoke('watchlist:set-monitoring', { itemId: entry.itemId, enabled })
    setCards((prev) =>
      prev.map((c) =>
        c.entry.itemId === entry.itemId
          ? { ...c, entry: { ...c.entry, isMonitoring: enabled } }
          : c,
      ),
    )
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <span className="text-gray-400">Monitoramento</span>
          <button
            role="switch"
            aria-checked={masterOn}
            onClick={() => setMasterOn((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition ${masterOn ? 'bg-odin-500' : 'bg-surface-overlay'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${masterOn ? 'left-[22px]' : 'left-0.5'}`}
            />
          </button>
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : cards.length === 0 ? (
        <p className="text-gray-400">
          Sua Watchlist está vazia. Busque um item e adicione-o para monitorar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <WatchlistCard
              key={card.entry.itemId}
              card={card}
              onOpen={() =>
                navigate({
                  name: 'item',
                  itemId: card.entry.itemId,
                  itemName: card.details?.item.name,
                })
              }
              onRemove={() => void remove(card.entry.itemId)}
              onTogglePause={() => void toggleMonitoring(card.entry)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WatchlistCard({
  card,
  onOpen,
  onRemove,
  onTogglePause,
}: {
  card: Card
  onOpen: () => void
  onRemove: () => void
  onTogglePause: () => void
}): React.JSX.Element {
  const { entry, details, state } = card
  const item = details?.item
  const analysis = details?.analysis

  return (
    <div className="oo-card relative">
      {state !== 'idle' && (
        <span className="absolute right-3 top-3 rounded-full bg-surface-overlay px-2 py-0.5 text-xs text-gray-300">
          {state === 'queued' ? 'Na fila' : 'Atualizando…'}
        </span>
      )}
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-center gap-3">
          {item?.imgPath && (
            <img src={item.imgPath} alt="" className="h-10 w-10 rounded object-contain" />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{item?.name ?? `Item #${entry.itemId}`}</p>
            {entry.isInMyStore && <span className="text-xs text-odin-300">🏪 Minha Loja</span>}
          </div>
        </div>

        {analysis ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Metric label="Menor preço" value={formatZeny(analysis.metrics.lowestActivePrice)} />
            <Metric
              label="Média ponderada"
              value={formatZeny(analysis.metrics.weightedAveragePrice)}
            />
            <Metric label="Spread" value={formatZeny(analysis.metrics.currentSpread)} />
            <Metric
              label="Pressão"
              value={`${(analysis.metrics.competitionPressure * 100).toFixed(0)}%`}
            />
          </dl>
        ) : (
          <p className="mt-3 text-xs text-gray-500">
            Sem dados — ligue o monitoramento ou abra o item.
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1">
          {analysis?.statuses.map((s) => (
            <span
              key={s}
              title={STATUS_DISPLAY[s].tooltip}
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${STATUS_DISPLAY[s].className}`}
            >
              {STATUS_DISPLAY[s].label}
            </span>
          ))}
          {analysis?.strategies.map((s) => (
            <span key={s.strategy} title={`${STRATEGY_DISPLAY[s.strategy].label}: ${s.reason}`}>
              {STRATEGY_DISPLAY[s.strategy].emoji}
            </span>
          ))}
        </div>
        {details && (
          <p className="mt-2 text-[10px] text-gray-500">
            Sync: {formatTimestamp(details.updatedAt)}
          </p>
        )}
      </button>

      <div className="mt-3 flex justify-end gap-2 border-t border-surface-border pt-2">
        <button
          onClick={onTogglePause}
          title={entry.isMonitoring ? 'Pausar monitoramento' : 'Retomar monitoramento'}
          className="rounded-md px-2 py-1 text-sm hover:bg-surface-overlay"
        >
          {entry.isMonitoring ? '👁️' : '🚫'}
        </button>
        <button
          onClick={onRemove}
          title="Remover da Watchlist"
          className="rounded-md px-2 py-1 text-sm hover:bg-log-error/20"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-mono text-gray-200">{value}</dd>
    </div>
  )
}
