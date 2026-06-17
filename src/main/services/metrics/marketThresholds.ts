// src/main/services/metrics/marketThresholds.ts
// Constantes de domínio (Thresholds) isoladas — proíbe "Magic Numbers" nas
// lógicas puras de SalesMetrics. Fonte: specs/Modules/Sales Metrics + architecture.md.

export const THRESHOLDS = {
  /** Janela móvel padrão das médias históricas (dias). */
  TIMEFRAME_DAYS: 7,
  /** Janela curta usada pela proteção de Flipping (dias). */
  RECENT_TIMEFRAME_DAYS: 3,

  /** Pressão da Concorrência (CP) acima disto => Mercado Saturado (150%). */
  SATURATED_CP: 1.5,
  /** (max-min)/min do dia supera isto => Volátil (30%). */
  VOLATILE_SPREAD_PCT: 0.3,
  /** Spread e volatilidade abaixo disto => Estável / "Dinheiro Certo" (10%). */
  STABLE_THRESHOLD_PCT: 0.1,

  /** Crash: queda do preço médio do último dia vs média dos 3 anteriores (>30%). */
  CRASH_PRICE_DROP_PCT: 0.3,
  /** Crash: queda do volume do último dia vs média dos 3 anteriores (>50%). */
  CRASH_VOLUME_DROP_PCT: 0.5,

  /** Undercutting/Premium: ignora lojas com estoque < 5% da média diária. */
  UNDERCUT_MIN_STOCK_PCT: 0.05,
  /** Undercutting: decremento em Zeny sobre o menor concorrente válido. */
  UNDERCUT_DECREMENT: 1,

  /** Flipping: mínimo ativo > 30% abaixo da média ponderada recente => Comprar. */
  FLIPPING_DISCOUNT_PCT: 0.3,
} as const

export type MarketThresholds = typeof THRESHOLDS
