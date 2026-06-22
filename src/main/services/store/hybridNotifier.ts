// src/main/services/store/hybridNotifier.ts
// Despacho híbrido das notificações da "Minha Loja" (F4): com a janela em foco,
// o alerta vira um toast in-app (push ao Renderer); minimizada/fora de foco,
// usa a Notificação nativa do SO. Função pura (sem `electron`) — a decisão de
// foco e os destinos são injetados, tornando o comportamento testável.

import type { StoreNotification } from './StoreTracker'

export interface HybridNotifierDeps {
  /** A janela está em foco/visível? (false quando minimizada ou em background). */
  isAppFocused: () => boolean
  /** Exibe o alerta dentro do app (toast). */
  toast: (notification: StoreNotification) => void
  /** Dispara a notificação nativa do SO. */
  osNotify: (notification: StoreNotification) => void
}

/** Cria um `Notifier` que escolhe toast (em foco) ou notificação nativa (fora). */
export function makeHybridNotifier(
  deps: HybridNotifierDeps,
): (notification: StoreNotification) => void {
  return (notification) =>
    deps.isAppFocused() ? deps.toast(notification) : deps.osNotify(notification)
}
