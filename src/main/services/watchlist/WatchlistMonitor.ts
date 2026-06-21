// src/main/services/watchlist/WatchlistMonitor.ts
// Motor unificado de polling da Watchlist (Bug #2b). Roda inteiramente no
// Main Process — imune ao throttling de timers do Chromium quando a janela
// está minimizada/oculta — e substitui os dois ciclos independentes que
// existiam antes: o loop do `WatchlistGrid` (Renderer) e o `StoreTracker`
// com seu próprio `setInterval` (Main), que consultavam os mesmos itens de
// forma duplicada.
//
// Itens marcados `isInMyStore` são detectados a partir dos MESMOS listings já
// buscados pela sincronização regular do ciclo (zero fetch extra). Por
// decisão de design, a detecção de Venda/DC de um item só ocorre enquanto ele
// estiver sendo ativamente monitorado (Master Switch ligado e o item em si
// não pausado) — pausar é, deliberadamente, "parar de consultar a rede para
// este item", incluindo a detecção de "Minha Loja".
//
// Prioridade na fila (architecture §3 / F3): itens comuns do ciclo entram como
// NORMAL; itens `isInMyStore` entram como HIGH (máxima), para a notificação de
// Venda/DC sair o quanto antes.

import type { ItemDetails, WatchlistCardState } from '@shared/types/ipc'
import type { RequestPriority, ServerType } from '@shared/types/domain'
import { MIN_ITEM_SPACING_MS, watchlistSpacingMs } from '@shared/watchlistCycle'
import type { ProfileService } from '../profile/ProfileService'
import type { StoreTracker } from '../store/StoreTracker'

export type CardBroadcaster = (
  itemId: number,
  state: WatchlistCardState,
  details: ItemDetails | null,
) => void
export type ItemSyncer = (
  itemId: number,
  serverType: ServerType,
  priority: RequestPriority,
) => Promise<ItemDetails>

const WATCHLIST_SERVER: ServerType = 'NIDHOGG'

export class WatchlistMonitor {
  private enabled = false
  private running = false

  constructor(
    private readonly profiles: ProfileService,
    private readonly syncItem: ItemSyncer,
    private readonly storeTracker: StoreTracker,
    private readonly broadcastCard: CardBroadcaster,
  ) {}

  get isEnabled(): boolean {
    return this.enabled
  }

  /** Liga/desliga o Master Switch. Ligar dispara o loop se ele não estiver rodando. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (enabled) void this.loop()
  }

  private async loop(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      while (this.enabled) {
        const profile = this.profiles.getActive()
        const entries = profile
          ? this.profiles.listWatchlist(profile.id).filter((e) => e.isMonitoring)
          : []

        if (entries.length === 0) {
          await interruptibleDelay(MIN_ITEM_SPACING_MS, () => this.enabled)
          continue
        }

        const spacing = watchlistSpacingMs(entries.length)
        for (const entry of entries) {
          this.broadcastCard(entry.itemId, 'queued', null)
        }

        for (const entry of entries) {
          if (!this.enabled) break
          this.broadcastCard(entry.itemId, 'updating', null)
          // Minha Loja (isInMyStore) tem prioridade máxima; itens comuns, NORMAL.
          const priority: RequestPriority = entry.isInMyStore ? 'HIGH' : 'NORMAL'
          try {
            const details = await this.syncItem(entry.itemId, WATCHLIST_SERVER, priority)
            if (entry.isInMyStore) this.storeTracker.track(entry.itemId, details.listings)
            this.broadcastCard(entry.itemId, 'idle', details)
          } catch {
            this.broadcastCard(entry.itemId, 'idle', null)
          }
          if (!this.enabled) break
          await interruptibleDelay(spacing, () => this.enabled)
        }
      }
    } finally {
      this.running = false
    }
  }
}

/** Espera `ms` em passos curtos, interrompível quando `isRunning()` vira falso. */
async function interruptibleDelay(ms: number, isRunning: () => boolean): Promise<void> {
  const STEP_MS = 500
  for (let elapsed = 0; elapsed < ms && isRunning(); elapsed += STEP_MS) {
    await delay(Math.min(STEP_MS, ms - elapsed))
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
