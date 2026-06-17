// src/main/services/store/StoreTracker.ts
// Tracker "Minha Loja" (architecture §6 / Profile 0003): cruza o nome do
// personagem com as lojas ativas para detectar Vendas e Desaparecimento (DC vs
// Sold Out). A detecção é PURA (testável); o motor agenda ciclos e notifica.

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
export type ListingsRefresher = (itemId: number) => Promise<ActiveStoreListing[]>

export class StoreTracker {
  private readonly lastStock = new Map<number, number>()
  private timer: ReturnType<typeof setInterval> | null = null
  private cycleRunning = false

  constructor(
    private readonly profiles: ProfileService,
    private readonly refresh: ListingsRefresher,
    private readonly notify: Notifier,
  ) {}

  /** Executa um ciclo de verificação dos itens marcados como "Minha Loja". */
  async runCycle(): Promise<void> {
    const profile = this.profiles.getActive()
    const characterName = profile?.characterName?.trim()
    if (!profile || !characterName) return // sem Char => nada a rastrear (sem rede)

    const tracked = this.profiles.listWatchlist(profile.id).filter((w) => w.isInMyStore)
    for (const entry of tracked) {
      let listings: ActiveStoreListing[]
      try {
        listings = await this.refresh(entry.itemId)
      } catch {
        continue // falha de rede não interrompe o ciclo (resiliência)
      }
      this.applyChange(
        entry.itemId,
        detectStoreChange({
          characterName,
          listings,
          previousStock: this.lastStock.get(entry.itemId) ?? null,
        }),
      )
    }
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

  /** Inicia o ciclo periódico (sem sobreposição de execuções). */
  start(intervalMs = 60_000): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      if (this.cycleRunning) return
      this.cycleRunning = true
      void this.runCycle().finally(() => {
        this.cycleRunning = false
      })
    }, intervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
