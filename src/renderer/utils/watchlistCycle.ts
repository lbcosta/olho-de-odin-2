// src/renderer/utils/watchlistCycle.ts
// Cadência do ciclo de monitoramento da Watchlist (corrige o polling "metralhadora").
//
// A spec (Watchlist 0003) define T_min = N × 3s e espaçamento S = T / N. Aqui
// usamos um período-alvo de ciclo (T) razoável e derivamos o espaçamento entre
// itens, nunca abaixo do Rate Limit. Para N = 1, re-sincroniza a cada ~60s
// (em vez de a cada ~3s, indefinidamente).

/** Período-alvo de um ciclo completo de monitoramento (T). */
export const WATCHLIST_CYCLE_TARGET_MS = 60_000
/** Espaçamento mínimo entre requisições (Rate Limit da GnJoy). */
export const MIN_ITEM_SPACING_MS = 3_000

/** Espaçamento entre as sincronizações de cada item: S = max(3s, T / N). */
export function watchlistSpacingMs(itemCount: number): number {
  if (itemCount <= 0) return MIN_ITEM_SPACING_MS
  return Math.max(MIN_ITEM_SPACING_MS, Math.round(WATCHLIST_CYCLE_TARGET_MS / itemCount))
}
