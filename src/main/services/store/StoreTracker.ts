// src/main/services/store/StoreTracker.ts
// Tracker "Minha Loja" (architecture §6 / Profile 0003): cruza o nome do
// personagem com as lojas ativas para detectar Vendas e Desaparecimento (DC vs
// Sold Out). A detecção é PURA (testável); quem alimenta os listings é o
// ciclo unificado da Watchlist (`WatchlistMonitor`, Bug #2b) — este tracker
// não busca dados na rede por conta própria, evitando o polling duplicado.

import type { ActiveStoreListing } from '@shared/types/domain'
import type { ProfileService } from '../profile/ProfileService'

export type StoreChange =
  | { kind: 'first-seen'; stock: number }
  | { kind: 'sale'; soldUnits: number; stock: number }
  | { kind: 'restock'; stock: number }
  | { kind: 'unchanged'; stock: number }
  | { kind: 'disappeared' }
  | { kind: 'absent' }

/**
 * Detecta a mudança da própria loja comparando o estoque atual com o anterior.
 * @param previousStock estoque do ciclo anterior, ou `null` se ainda não rastreado.
 */
export function detectStoreChange(opts: {
  characterName: string
  listings: ActiveStoreListing[]
  previousStock: number | null
}): StoreChange {
  const mine = opts.listings.find((l) => l.itemSellerCharName === opts.characterName)

  if (!mine) {
    return opts.previousStock !== null ? { kind: 'disappeared' } : { kind: 'absent' }
  }
  if (opts.previousStock === null) {
    return { kind: 'first-seen', stock: mine.itemCnt }
  }
  if (mine.itemCnt < opts.previousStock) {
    return { kind: 'sale', soldUnits: opts.previousStock - mine.itemCnt, stock: mine.itemCnt }
  }
  if (mine.itemCnt > opts.previousStock) {
    return { kind: 'restock', stock: mine.itemCnt }
  }
  return { kind: 'unchanged', stock: mine.itemCnt }
}

export interface StoreNotification {
  title: string
  body: string
}
export type Notifier = (notification: StoreNotification) => void

export class StoreTracker {
  private readonly lastStock = new Map<number, number>()

  constructor(
    private readonly profiles: ProfileService,
    private readonly notify: Notifier,
  ) {}

  /**
   * Aplica listings já buscados (pelo ciclo da Watchlist) à detecção de
   * Venda/DC de `itemId`. Sem Char configurado, é um no-op silencioso.
   */
  track(itemId: number, listings: ActiveStoreListing[]): void {
    const characterName = this.profiles.getActive()?.characterName?.trim()
    if (!characterName) return
    this.applyChange(
      itemId,
      detectStoreChange({
        characterName,
        listings,
        previousStock: this.lastStock.get(itemId) ?? null,
      }),
    )
  }

  private applyChange(itemId: number, change: StoreChange): void {
    switch (change.kind) {
      case 'sale':
        this.lastStock.set(itemId, change.stock)
        this.notify({
          title: 'Venda detectada! 💰',
          body: `Você vendeu ${change.soldUnits} unidade(s).`,
        })
        break
      case 'disappeared':
        this.lastStock.delete(itemId)
        this.notify({
          title: 'Alerta ⚠️: Sua loja sumiu do mercado',
          body: 'Você pode ter esgotado o estoque ou tomado Disconnect (DC).',
        })
        break
      case 'first-seen':
      case 'restock':
      case 'unchanged':
        this.lastStock.set(itemId, change.stock)
        break
      case 'absent':
        break
    }
  }
}
