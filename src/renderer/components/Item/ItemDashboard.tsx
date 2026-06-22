// src/renderer/components/Item/ItemDashboard.tsx
// Tela de Detalhes do Item (T018):
//  - Esquerda: dados do item + ações (Watchlist, Sincronizar) + updated_at.
//  - Direita: Métricas de Mercado + tags + estratégias.
//  - Centro: Lojas Ativas (Lazy Load /navi com cópia para o clipboard).

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ActiveStoreListing, StoreItemDetail } from '@shared/types/domain'
import type { ItemDetails } from '@shared/types/ipc'
import { formatNaviCommand } from '@shared/navi'
import { getApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import { SkeletonCard } from '../ui/Skeleton'
import {
  STATUS_DISPLAY,
  STRATEGY_DISPLAY,
  formatZeny,
  formatZenyOrDash,
} from '../../utils/marketDisplay'
import { RelativeTime } from '../ui/RelativeTime'

type SortOrder = 'asc' | 'desc'

export function ItemDashboard({ itemId }: { itemId: number }): React.JSX.Element {
  const [details, setDetails] = useState<ItemDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [order, setOrder] = useState<SortOrder>('asc')
  const { addToast } = useToast()

  const load = useCallback(async () => {
    const api = getApi()
    if (!api) return
    setLoading(true)
    try {
      const [data, watch] = await Promise.all([
        api.invoke('item:get-details', { itemId, serverType: 'NIDHOGG' }),
        api.invoke('watchlist:list'),
      ])
      setDetails(data)
      setInWatchlist(watch.some((w) => w.itemId === itemId))
    } catch {
      addToast('Falha ao carregar o item.', 'error')
    } finally {
      setLoading(false)
    }
  }, [itemId, addToast])

  useEffect(() => {
    void load()
  }, [load])

  async function sync(): Promise<void> {
    const api = getApi()
    if (!api || syncing) return
    setSyncing(true)
    try {
      setDetails(await api.invoke('item:sync', { itemId, serverType: 'NIDHOGG' }))
      addToast('Item sincronizado.', 'success')
    } catch {
      addToast('Erro ao sincronizar com a GnJoy.', 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function toggleWatchlist(): Promise<void> {
    const api = getApi()
    if (!api) return
    try {
      if (inWatchlist) {
        await api.invoke('watchlist:remove', { itemId })
        setInWatchlist(false)
      } else {
        await api.invoke('watchlist:add', { itemId })
        setInWatchlist(true)
      }
    } catch {
      addToast('Não foi possível atualizar a Watchlist.', 'error')
    }
  }

  const sortedListings = useMemo(() => {
    const list = details?.listings ?? []
    return [...list].sort((a, b) =>
      order === 'asc' ? a.itemPrice - b.itemPrice : b.itemPrice - a.itemPrice,
    )
  }, [details, order])

  if (loading && !details) {
    return (
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }
  if (!details) return <p className="p-6 text-gray-400">Item indisponível.</p>

  const { item, analysis } = details

  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Info do item */}
        <section className="oo-card">
          <div className="flex items-start gap-4">
            <img src={item.imgPath} alt="" className="h-16 w-16 rounded-lg object-contain" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-xs text-gray-400">
                {item.type || 'item'} · #{item.itemId}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Última sincronização: <RelativeTime iso={details.updatedAt} />
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => void toggleWatchlist()}
              className={`rounded-lg border px-3 py-1.5 text-sm ${inWatchlist ? 'border-odin-500 text-odin-300' : 'border-surface-border hover:border-odin-500'}`}
            >
              {inWatchlist ? '★ Na Watchlist' : '☆ Adicionar à Watchlist'}
            </button>
            <button
              onClick={() => void sync()}
              disabled={syncing}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-odin-500 disabled:opacity-60"
            >
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar agora'}
            </button>
          </div>
        </section>

        {/* Métricas */}
        <section className="oo-card">
          <h3 className="mb-3 text-sm font-medium text-odin-300">Métricas de Mercado</h3>
          {analysis ? (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Metric
                  label="Média Ponderada Real"
                  value={formatZenyOrDash(analysis.metrics.weightedAveragePrice)}
                />
                <Metric
                  label="Menor Preço Ativo"
                  value={formatZeny(analysis.metrics.lowestActivePrice)}
                />
                <Metric label="Spread Atual" value={formatZeny(analysis.metrics.currentSpread)} />
                <Metric
                  label="Pressão da Concorrência"
                  value={`${(analysis.metrics.competitionPressure * 100).toFixed(0)}%`}
                />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {analysis.statuses.map((s) => (
                  <span
                    key={s}
                    title={STATUS_DISPLAY[s].tooltip}
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_DISPLAY[s].className}`}
                  >
                    {STATUS_DISPLAY[s].label}
                  </span>
                ))}
              </div>
              {analysis.strategies.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-gray-300">
                  {analysis.strategies.map((s) => (
                    <li key={s.strategy} title={s.reason}>
                      {STRATEGY_DISPLAY[s.strategy].emoji}{' '}
                      <strong>{STRATEGY_DISPLAY[s.strategy].label}</strong>
                      {s.suggestedPrice !== null && <> — {formatZeny(s.suggestedPrice)}</>}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">Sem lojas ativas. Sincronize para atualizar.</p>
          )}
        </section>
      </div>

      {/* Lojas ativas */}
      <section className="oo-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-odin-300">
            Lojas Ativas ({details.listings.length})
          </h3>
          <button
            onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="text-xs text-gray-400 hover:text-odin-400"
          >
            Preço {order === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        {sortedListings.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma loja vendendo este item agora.</p>
        ) : (
          <ul className="space-y-2">
            {sortedListings.map((listing) => (
              <StoreRow key={listing.ssi} listing={listing} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-mono text-gray-100">{value}</dd>
    </div>
  )
}

function StoreRow({ listing }: { listing: ActiveStoreListing }): React.JSX.Element {
  const [copying, setCopying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<StoreItemDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const { addToast } = useToast()

  async function copyNavi(): Promise<void> {
    const api = getApi()
    if (!api || copying) return
    setCopying(true)
    try {
      const loc = await api.invoke('item:expand-store', {
        svrId: listing.svrId,
        mapId: listing.mapId,
        ssi: listing.ssi,
      })
      const navi = formatNaviCommand(loc)
      await navigator.clipboard?.writeText(navi)
      addToast(`Copiado: ${navi}`, 'success')
    } catch {
      addToast('Falha ao obter a localização da loja.', 'error')
    } finally {
      setCopying(false)
    }
  }

  // Lazy Load (Item 0003): slots/encantamentos só são buscados ao expandir,
  // uma única vez (cacheados por ssi no Main).
  async function toggleExpand(): Promise<void> {
    const next = !expanded
    setExpanded(next)
    if (!next || detail || loadingDetail) return
    const api = getApi()
    if (!api) return
    setLoadingDetail(true)
    try {
      setDetail(
        await api.invoke('item:expand-detail', {
          svrId: listing.svrId,
          mapId: listing.mapId,
          ssi: listing.ssi,
        }),
      )
    } catch {
      addToast('Falha ao carregar slots/encantamentos.', 'error')
      setExpanded(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <li className="rounded-lg border border-surface-border px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{listing.storeName || listing.itemSellerCharName}</p>
          <p className="truncate text-xs text-gray-400">{listing.itemSellerCharName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-odin-300">{formatZeny(listing.itemPrice)}</p>
            <p className="text-xs text-gray-500">{listing.itemCnt} un.</p>
          </div>
          <button
            onClick={() => void toggleExpand()}
            aria-expanded={expanded}
            className="rounded-md border border-surface-border px-2 py-1 text-xs hover:border-odin-500"
            title="Ver slots e encantamentos"
          >
            {expanded ? '▾' : '▸'}
          </button>
          <button
            onClick={() => void copyNavi()}
            disabled={copying}
            className="rounded-md border border-surface-border px-2 py-1 text-xs hover:border-odin-500 disabled:opacity-60"
            title="Copiar /navi para o clipboard"
          >
            {copying ? '...' : '📋 /navi'}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 border-t border-surface-border pt-2 text-xs">
          {loadingDetail ? (
            <p className="text-gray-500">Carregando slots/encantamentos…</p>
          ) : detail ? (
            <ItemDetailView detail={detail} />
          ) : null}
        </div>
      )}
    </li>
  )
}

function ItemDetailView({ detail }: { detail: StoreItemDetail }): React.JSX.Element {
  const isText = (s: string | null): s is string => Boolean(s)
  const cards = [detail.slot1, detail.slot2, detail.slot3, detail.slot4].filter(isText)
  const enchants = [
    detail.randomOpt1,
    detail.randomOpt2,
    detail.randomOpt3,
    detail.randomOpt4,
  ].filter(isText)

  if (cards.length === 0 && enchants.length === 0) {
    return <p className="text-gray-500">Sem cartas ou encantamentos.</p>
  }

  return (
    <div className="space-y-1">
      {cards.length > 0 && (
        <p>
          <span className="text-gray-500">Cartas:</span>{' '}
          <span className="text-gray-200">{cards.join(', ')}</span>
        </p>
      )}
      {enchants.length > 0 && (
        <p>
          <span className="text-gray-500">Encantamentos:</span>{' '}
          <span className="text-gray-200">{enchants.join(', ')}</span>
        </p>
      )}
    </div>
  )
}
